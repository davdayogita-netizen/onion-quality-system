# PyTorch Quality Classifier Models

Place trained PyTorch classification weights in this directory.

## Default Expected Model:
- File: `onion_classifier.pt` (e.g. ResNet/EfficientNet model classifying overall quality or firmness)
- Output categories:
  - `Grade A`: Premium
  - `Grade B`: Good commercial
  - `Grade C`: Fair / Processing
  - `Grade D`: Substandard
  - `Reject`: Decomposed / Non-marketable

## Configuration
In `.env`:
```env
INFERENCE_MODE=production
CLASSIFIER_MODEL_PATH=models/classifier/onion_classifier.pt
```

When `INFERENCE_MODE=demo`, the system uses `DemoOnionClassifier` to produce structured assessments deterministically from image features.
