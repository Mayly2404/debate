# Debate Raccoon Suite v2

Bản này tập trung vào local React test trước khi đưa lên server.

## Chạy local

```bash
npm config set registry https://registry.npmjs.org/
npm install
npm run dev
```

Mở:
- http://localhost:5173/
- http://localhost:5173/host.html
- http://localhost:5173/ungho.html
- http://localhost:5173/phandoi.html
- http://localhost:5173/user.html

## Tính năng chính đã thêm

- đồng hồ chạy theo `Date.now()` để sát 1 giây hơn
- import ảnh thí sinh bằng file local
- import âm thanh bằng file local
- host bật/tắt kiến nghị, lượt, intro, điểm overlay, thống kê
- giao diện trình chiếu thiên về style Teen hơn
- chuông, chấp nhận câu hỏi, gửi điểm, gửi thống kê đều có hook phát sound
- khi host chấp nhận câu hỏi, màn hình đội còn lại nhận tín hiệu và chạy timer câu hỏi
- thêm chế độ thống kê cho giám khảo và nhóm
- thống kê có biểu đồ tròn ở màn hình trình chiếu
- chấm điểm và thống kê có thể mở theo khung thời gian

## Lưu ý

- realtime hiện dùng `BroadcastChannel + localStorage`, hợp để test local hoặc nhiều tab/trình duyệt cùng máy. Muốn dùng nhiều thiết bị trong lớp, nên thay bằng Firebase hoặc WebSocket.
- âm thanh từ file local sẽ được lưu dạng data URL trong localStorage của trình duyệt.
