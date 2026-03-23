import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from auth import get_current_user
from models.profile import Profile, ProfileUpdate, ProfileRead

router = APIRouter(prefix="/profile", tags=["profile"])


async def get_or_create_profile(user_id: str, db: AsyncSession) -> Profile:
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = Profile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.get("", response_model=ProfileRead)
async def get_profile(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_or_create_profile(user_id, db)


@router.put("", response_model=ProfileRead)
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_profile(user_id, db)
    for field, value in body.model_dump().items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.post("/images")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    images_dir = os.environ.get("IMAGES_DIR", "/tmp/uploads")
    os.makedirs(images_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(images_dir, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())
    return {"url": f"/uploads/{filename}"}
