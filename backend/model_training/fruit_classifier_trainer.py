"""
Fruit Classifier Trainer

Trains a transfer-learned MobileNetV2 classifier on Fruits-360 to recognise the
ten fruits supported by the Digitify Fruit Detector module:
    Apple, Banana, Mango, Orange, Grapes, Watermelon,
    Strawberry, Pineapple, Peach, Pear.

Because Fruits-360 has clean, white-background studio shots, we use aggressive
data augmentation (rotation, brightness, contrast, zoom, noise, random cutout)
so that the trained model generalises to real phone photos.

This script reads images directly from datasets/fruits-360/ without staging a
copy on disk (disk space here is tight).

Outputs:
  ../models/fruit_classifier.keras
  ../models/fruit_classifier_labels.json

Run:
  python fruit_classifier_trainer.py
"""

import json
import os
import random
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2

# ------------------------------------------------------------------ CONFIG ----

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent

RAW_DATASET = HERE / "datasets" / "fruits-360"
MODEL_OUT = BACKEND / "models" / "fruit_classifier.keras"
LABELS_OUT = BACKEND / "models" / "fruit_classifier_labels.json"

IMG_SIZE = 128           # small = fast on CPU, still enough for 10-class
BATCH_SIZE = 32
INITIAL_EPOCHS = 8       # frozen backbone
FINETUNE_EPOCHS = 4      # unfrozen top layers
SEED = 1337

# Cap per class to keep training time short and classes balanced.
MAX_TRAIN_PER_CLASS = 1200
MAX_VAL_PER_CLASS   = 300

CLASS_PREFIX_MAP = {
    "apple":       "Apple",
    "banana":      "Banana",
    "mango":       "Mango",
    "orange":      "Orange",
    "grape":       "Grapes",
    "watermelon":  "Watermelon",
    "strawberry":  "Strawberry",
    "pineapple":   "Pineapple",
    "peach":       "Peach",
    "pear":        "Pear",
}
TARGET_LABELS = sorted(set(CLASS_PREFIX_MAP.values()))
LABEL_TO_INDEX = {name: i for i, name in enumerate(TARGET_LABELS)}


# -------------------------------------------------------- FILE ENUMERATION ----

def _match_target(class_folder_name):
    lowered = class_folder_name.lower().strip()
    for prefix, target in CLASS_PREFIX_MAP.items():
        if lowered == prefix or lowered.startswith(prefix + " ") or lowered.startswith(prefix + "-"):
            return target
    return None


def _list_split(split_dir, cap_per_class):
    """
    Enumerate images from Fruits-360's Training/ or Test/ layout and return
    (filepaths[], labels[]) with round-robin variety balancing so each target
    class gets at most cap_per_class images drawn evenly across sub-varieties.
    """
    rng = random.Random(SEED)
    buckets = defaultdict(list)  # target_label -> list of (variety_name, [images])
    for class_dir in sorted(split_dir.iterdir()):
        if not class_dir.is_dir():
            continue
        target = _match_target(class_dir.name)
        if target is None:
            continue
        imgs = [str(p) for p in class_dir.iterdir()
                if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
        if imgs:
            rng.shuffle(imgs)
            buckets[target].append(imgs)

    files, labels = [], []
    for label in TARGET_LABELS:
        variety_lists = buckets.get(label, [])
        selected = []
        queues = [list(v) for v in variety_lists]
        while queues and len(selected) < cap_per_class:
            new_queues = []
            for q in queues:
                if len(selected) >= cap_per_class:
                    break
                if q:
                    selected.append(q.pop())
                    if q:
                        new_queues.append(q)
            queues = new_queues
        files.extend(selected)
        labels.extend([LABEL_TO_INDEX[label]] * len(selected))
        print(f"[data] {split_dir.name}/{label}: {len(selected)} images "
              f"from {len(variety_lists)} varieties")
    return files, labels


def build_datasets():
    train_src = RAW_DATASET / "Training"
    val_src   = RAW_DATASET / "Test"
    if not train_src.exists() or not val_src.exists():
        print(f"[data] Expected {train_src} and {val_src}"); sys.exit(1)

    train_files, train_labels = _list_split(train_src, MAX_TRAIN_PER_CLASS)
    val_files,   val_labels   = _list_split(val_src,   MAX_VAL_PER_CLASS)

    def _decode(path, label):
        raw = tf.io.read_file(path)
        img = tf.image.decode_image(raw, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        img = tf.cast(img, tf.float32)
        onehot = tf.one_hot(label, depth=len(TARGET_LABELS))
        return img, onehot

    def _make(files, labels, shuffle):
        ds = tf.data.Dataset.from_tensor_slices((files, labels))
        if shuffle:
            ds = ds.shuffle(len(files), seed=SEED, reshuffle_each_iteration=True)
        ds = ds.map(_decode, num_parallel_calls=tf.data.AUTOTUNE)
        ds = ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
        return ds

    return _make(train_files, train_labels, True), _make(val_files, val_labels, False)


# ---------------------------------------------------------------- MODEL -------

def _augment_layer():
    # All augmentations operate on the raw 0-255 float input; Rescaling to
    # [-1, 1] happens AFTER this block.
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.4, fill_mode="reflect"),
        layers.RandomZoom(0.25),
        layers.RandomTranslation(0.1, 0.1, fill_mode="reflect"),
        layers.RandomBrightness(0.3),
        layers.RandomContrast(0.3),
    ], name="augment")


def build_model():
    inputs = layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = _augment_layer()(inputs)
    # MobileNetV2 preprocess = (x/127.5) - 1  — bake it in via Rescaling.
    x = layers.Rescaling(1.0 / 127.5, offset=-1.0, name="mobilenet_rescale")(x)

    base = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(len(TARGET_LABELS), activation="softmax")(x)

    return models.Model(inputs, outputs, name="fruit_classifier"), base


def train():
    tf.random.set_seed(SEED); random.seed(SEED); np.random.seed(SEED)

    train_ds, val_ds = build_datasets()
    model, base = build_model()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True, monitor="val_accuracy"),
        tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.5, monitor="val_loss", verbose=1),
    ]

    print("\n=== Phase 1: frozen backbone ===\n", flush=True)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=INITIAL_EPOCHS,
              callbacks=callbacks, verbose=2)

    print("\n=== Phase 2: fine-tune top layers ===\n", flush=True)
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=FINETUNE_EPOCHS,
              callbacks=callbacks, verbose=2)

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    model.save(MODEL_OUT)
    LABELS_OUT.write_text(json.dumps(TARGET_LABELS, indent=2))
    print(f"\nSaved: {MODEL_OUT}")
    print(f"Saved: {LABELS_OUT}")


if __name__ == "__main__":
    train()
