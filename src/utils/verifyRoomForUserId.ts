export function verifyRoomIdForUserId(
  roomId: string,
  userId: string,
  roomType: "pm" | "vc"
) {
  const splitRoomId = roomId.split("_");

  if (splitRoomId[splitRoomId.length - 1] !== roomType) {
    return false;
  }

  for (let i = 0; i < splitRoomId.length; i++) {
    if (splitRoomId[i] === userId) {
      return true;
    }
  }
  return false;
}
