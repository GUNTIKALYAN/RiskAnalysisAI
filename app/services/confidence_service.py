def calculate_confidence(data: dict):
    total = len(data)

    missing = sum(1 for v in data.values() if v is None)
    weak_signals = sum(1 for v in data.values() if v == 0)

    penalty = (missing * 0.7 + weak_signals * 0.3) / total

    return round(max(0.5, 1 - penalty), 2)