import os
import cv2
import numpy as np
from typing import Dict, Any
from backend.app.ml.classification.base import BaseClassifier, ClassificationResult


class PyTorchClassifier(BaseClassifier):
    """
    Production PyTorch Onion Quality Classifier.
    Loads custom PyTorch / TorchVision checkpoint (e.g. ResNet50 or EfficientNet)
    to classify overall bulb firmness and marketability.
    """

    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"PyTorch classifier weights not found at '{self.model_path}'. "
                f"Please place your trained .pt model in this path or configure INFERENCE_MODE=demo in .env."
            )

        try:
            import torch
            import torchvision.transforms as transforms
            self.torch = torch
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model = torch.load(self.model_path, map_location=self.device)
            self.model.eval()

            self.transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
        except ImportError:
            raise RuntimeError(
                "PyTorch and Torchvision are required for production classifier inference. "
                "Please run `pip install torch torchvision` or switch INFERENCE_MODE=demo."
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load PyTorch classifier model from '{self.model_path}': {str(e)}")

    def predict(self, image_bgr: np.ndarray, stats: Dict[str, Any] = None) -> ClassificationResult:
        if self.model is None:
            raise RuntimeError("PyTorch model is not initialized.")

        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        tensor = self.transform(rgb).unsqueeze(0).to(self.device)

        with self.torch.no_grad():
            outputs = self.model(tensor)
            probs = self.torch.softmax(outputs, dim=1)[0].cpu().numpy()

        idx = int(np.argmax(probs))
        pred_class = self.CLASSES[idx] if idx < len(self.CLASSES) else "Unknown"
        confidence = float(probs[idx])

        prob_dict = {
            self.CLASSES[i]: float(probs[i])
            for i in range(min(len(self.CLASSES), len(probs)))
        }

        return ClassificationResult(
            predicted_class=pred_class,
            confidence=round(confidence, 3),
            probabilities=prob_dict,
            is_demo=False
        )
