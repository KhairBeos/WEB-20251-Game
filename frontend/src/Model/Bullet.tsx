export class Bullet {
    x: number; // Vị trí ban đầu X (giữa)
    y: number; // Vị trí ban đầu Y (giữa)
    width: number;
    height: number;
    frameIndex: number = 0; // Khung hình hoạt ảnh hiện tại
    frameCounter: number = 0; 
    degree:number // Goc quay
  // Constructor để khởi tạo các thuộc tính cơ bản
  constructor(x:number,y:number,width:number,height:number,degree:number) {
    this.x = x;
    this.y = y;
    this.width = width,
    this.height = height,
    this.degree = degree
  }

  
}