"""
Camera model builder for Backend.

Rebuild the legacy camera CNN architecture, load trained weights from the
legacy H5 file, and save a Keras 3 compatible model.
"""

from pathlib import Path

import h5py
import numpy as np
from tensorflow import keras


def build_camera_model() -> keras.Model:
    """Recreate the original camera digit model architecture."""
    return keras.Sequential([
        keras.layers.Input(shape=(28, 28, 1)),
        keras.layers.Conv2D(32, (5, 5), activation="relu", padding="same", name="conv2d_12"),
        keras.layers.Conv2D(64, (5, 5), activation="relu", padding="same", name="conv2d_13"),
        keras.layers.MaxPooling2D((2, 2), name="max_pooling2d_9"),
        keras.layers.BatchNormalization(name="batch_normalization_5"),
        keras.layers.Conv2D(128, (5, 5), activation="relu", padding="same", name="conv2d_14"),
        keras.layers.MaxPooling2D((2, 2), name="max_pooling2d_10"),
        keras.layers.Conv2D(256, (5, 5), activation="relu", padding="same", name="conv2d_15"),
        keras.layers.MaxPooling2D((2, 2), name="max_pooling2d_11"),
        keras.layers.BatchNormalization(name="batch_normalization_6"),
        keras.layers.Dropout(0.25, name="dropout_6"),
        keras.layers.Flatten(name="flatten_4"),
        keras.layers.Dense(128, activation="relu", name="dense_7"),
        keras.layers.Dropout(0.5, name="dropout_7"),
        keras.layers.Dense(10, activation="softmax", name="dense_8"),
    ])


def convert_camera_model(input_path: Path, output_path: Path) -> None:
    """Convert legacy `my_model.h5` into `camera_model.keras`."""
    print("Reconstructing camera model architecture...")
    model = build_camera_model()

    print("Loading legacy weights...")
    with h5py.File(input_path, "r") as f:
        weights_group = f["model_weights"]
        for layer in model.layers:
            layer_name = layer.name
            if layer_name not in weights_group:
                continue

            layer_group = weights_group[layer_name]
            if layer_name not in layer_group:
                continue

            sub = layer_group[layer_name]
            if isinstance(layer, (keras.layers.Conv2D, keras.layers.Dense)):
                layer_weights = [np.array(sub["kernel:0"]), np.array(sub["bias:0"])]
            elif isinstance(layer, keras.layers.BatchNormalization):
                layer_weights = [
                    np.array(sub["gamma:0"]),
                    np.array(sub["beta:0"]),
                    np.array(sub["moving_mean:0"]),
                    np.array(sub["moving_variance:0"]),
                ]
            else:
                continue

            layer.set_weights(layer_weights)
            print(f"  loaded: {layer_name}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(output_path)
    print(f"Saved converted model: {output_path}")

    dummy = np.zeros((1, 28, 28, 1), dtype="float32")
    pred = model.predict(dummy, verbose=0)
    print(f"Sanity check prediction shape: {pred.shape}")


if __name__ == "__main__":
    backend_dir = Path(__file__).resolve().parents[1]
    input_model = backend_dir / "models" / "my_model.h5"
    output_model = backend_dir / "models" / "camera_model.keras"

    if not input_model.exists():
        raise FileNotFoundError(f"Legacy camera model not found: {input_model}")

    convert_camera_model(input_model, output_model)
