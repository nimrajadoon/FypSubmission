"""
Voice model builder for Backend.

This script rebuilds the legacy voice CNN architecture, loads the trained
weights from the legacy H5 file, and saves a Keras 3 compatible model.
"""

from pathlib import Path

import h5py
import numpy as np
from tensorflow import keras


def convert_voice_model(input_path: Path, output_path: Path) -> keras.Model:
    """
    Convert legacy Keras model to Keras 3.x compatible format.
    
    The original model architecture (from Keras 2.1.6):
    - Conv2D(32, 2x2) -> Conv2D(48, 2x2) -> MaxPooling2D -> BatchNorm -> 
    - Conv2D(128, 2x2) -> MaxPooling2D -> BatchNorm -> Dropout(0.25) ->
    - Flatten -> Dense(128) -> Dropout(0.25) -> Dense(64) -> BatchNorm -> Dropout(0.4) -> Dense(10)
    
    Input shape: (40, 40, 1) - MFCC features
    Output: 10 classes (digits 0-9)
    """
    
    print("Creating model architecture...")
    
    # Recreate exact architecture from the old model
    model = keras.Sequential([
        keras.layers.Input(shape=(40, 40, 1)),
        keras.layers.Conv2D(32, (2, 2), activation='relu', padding='same', name='conv2d_7'),
        keras.layers.Conv2D(48, (2, 2), activation='relu', padding='same', name='conv2d_8'),
        keras.layers.MaxPooling2D((2, 2), name='max_pooling2d_5'),
        keras.layers.BatchNormalization(name='batch_normalization_7'),
        keras.layers.Conv2D(128, (2, 2), activation='relu', padding='same', name='conv2d_9'),
        keras.layers.MaxPooling2D((2, 2), name='max_pooling2d_6'),
        keras.layers.BatchNormalization(name='batch_normalization_8'),
        keras.layers.Dropout(0.25, name='dropout_7'),
        keras.layers.Flatten(name='flatten_3'),
        keras.layers.Dense(128, activation='relu', name='dense_7'),
        keras.layers.Dropout(0.25, name='dropout_8'),
        keras.layers.Dense(64, activation='relu', name='dense_8'),
        keras.layers.BatchNormalization(name='batch_normalization_9'),
        keras.layers.Dropout(0.4, name='dropout_9'),
        keras.layers.Dense(10, activation='softmax', name='dense_9')
    ])

    print("\nModel architecture:")
    model.summary()

    # Load weights from old file
    print("\n\nLoading weights from legacy model...")
    
    try:
        with h5py.File(input_path, 'r') as f:
            weights_group = f['model_weights']
            
            for layer in model.layers:
                layer_name = layer.name
                if layer_name in weights_group:
                    layer_group = weights_group[layer_name]
                    if layer_name in layer_group:
                        sub_group = layer_group[layer_name]
                        
                        # Get expected weight names from layer
                        expected_weights = [w.name.split('/')[-1].replace(':0', '') for w in layer.weights]
                        
                        weights_to_set = []
                        for expected_name in expected_weights:
                            key = f"{expected_name}:0"
                            if key in sub_group:
                                weight_data = np.array(sub_group[key])
                                weights_to_set.append(weight_data)
                                print(f"  ✓ Loaded {layer_name}/{key}: shape={weight_data.shape}")
                        
                        if len(weights_to_set) == len(expected_weights):
                            layer.set_weights(weights_to_set)
    except Exception as e:
        print(f"Error loading legacy model: {e}")
        print("Will save model with random weights (you need to retrain or provide a valid model)")

    # Save in new format
    print(f"\n\nSaving model to {output_path}...")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(output_path)
    print(f"✓ Model saved successfully!")

    # Test prediction
    print("\nTesting model with dummy input...")
    test_input = np.random.rand(1, 40, 40, 1).astype(np.float32)
    prediction = model.predict(test_input, verbose=0)
    print(f"Test prediction shape: {prediction.shape}")
    print(f"Predicted digit: {np.argmax(prediction)}")
    
    return model


if __name__ == '__main__':
    backend_dir = Path(__file__).resolve().parents[1]
    legacy_path = backend_dir / "models" / "mnist_sound_legacy.h5"
    output_path = backend_dir / "models" / "voice_model.keras"

    if legacy_path.exists():
        convert_voice_model(legacy_path, output_path)
    else:
        print(f"Legacy model not found at {legacy_path}")
        print("Please copy the original mnist_sound.h5 file to models/mnist_sound_legacy.h5")
        print("Then run this script again.")
