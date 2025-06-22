# import pickle
# import os
# from django.conf import settings

# # Absolute path to your pickle file in the project root
# MODEL_PATH = os.path.join(settings.BASE_DIR, 'emotion_detection.pkl')

# # Load model once when server starts
# with open(MODEL_PATH, 'rb') as f:
#     model = pickle.load(f)

# def predict_emotion(message: str):
#     """Return predicted emotion label for input message."""
#     return model.predict([message])[0]


import os
import torch
import torch.nn as nn
import pickle
from transformers import DistilBertTokenizer, DistilBertModel


# --------- MODEL DEFINITION --------------
class DistilBERTClassifier(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.distilbert = DistilBertModel.from_pretrained('distilbert-base-uncased')
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.distilbert.config.dim, num_classes)

    def forward(self, input_ids, attention_mask):
        output = self.distilbert(input_ids=input_ids, attention_mask=attention_mask)
        hidden_state = output.last_hidden_state[:, 0]
        return self.classifier(self.dropout(hidden_state))

# -------- LOAD MODEL FUNCTION -------------------
class EmotionDetector:
    def __init__(self, model_path):
        self.model_path = model_path
        self.model, self.tokenizer, self.label_encoder, self.max_len = self._load_model()

    def _load_model(self):
        with open(self.model_path, 'rb') as f:
            data = pickle.load(f)

        model = DistilBERTClassifier(data['num_classes'])
        model.load_state_dict(data['model_state_dict'], strict=False)
        model.eval()

        tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        return model, tokenizer, data['label_encoder'], data['max_len']

    def predict(self, texts):
        if isinstance(texts, str):
            texts = [texts]

        inputs = self.tokenizer(
            texts,
            padding='max_length',
            truncation=True,
            max_length=self.max_len,
            return_tensors='pt'
        )
        with torch.no_grad():
            outputs = self.model(inputs['input_ids'], inputs['attention_mask'])
            preds = torch.argmax(outputs, dim=1).numpy()
            labels = self.label_encoder.inverse_transform(preds)
        return labels
