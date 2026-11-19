interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/** True if two boxes overlap. Boxes that only touch along an edge do not count. */
export function overlaps(aPos: Point, aSize: Size, bPos: Point, bSize: Size): boolean {
  return (
    aPos.x < bPos.x + bSize.width &&
    aPos.x + aSize.width > bPos.x &&
    aPos.y < bPos.y + bSize.height &&
    aPos.y + aSize.height > bPos.y
  );
}
