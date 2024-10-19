export function isUserInRoom(socket, roomId) {
  const room = socket.adapter.rooms.get(roomId);
  return room && room.has(socket.id);
}
