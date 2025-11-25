"""
Package utility functions
"""
import uuid
import string
import random


def generate_tracking_id() -> str:
    """
    Generate a unique tracking ID
    Format: TRK-XXXXXXXX (8 alphanumeric characters)
    """
    # Generate 8 random alphanumeric characters
    characters = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choice(characters) for _ in range(8))
    return f"TRK-{random_part}"


def generate_uuid_tracking_id() -> str:
    """
    Alternative: Generate tracking ID using UUID
    Format: TRK-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    """
    uuid_str = str(uuid.uuid4()).replace('-', '').upper()[:16]
    return f"TRK-{uuid_str}"

