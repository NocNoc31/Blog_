---
layout: '../../layouts/Post.astro'
title: Rehab Robot 2DOF
description: Hệ thống robot 2 bậc sử dụng giao tiếp CAN bus hỗ trợ phục hồi chức năng.
publishedAt: 2025-06-22
image: /images/RehabRobot/3D.jpg
category: HUST
---


## GIỚI THIỆU
Hệ thống ROBOT 2 bậc tự do (2 DOF) được phát triển dựa trên cảm hứng từ cấu trúc và chuyển động của cánh tay người, tập trung vào hai khớp chính: khớp vai và khớp khuỷu. Toàn bộ thiết kế được thể hiện chi tiết qua bản vẽ 3D (thực hiện bởi Đạt).

Hệ thống bao gồm:
- Máy tính điều khiển (laptop hoặc miniPC)
- Bộ chuyển đổi giao tiếp CAN
- Cơ cấu chấp hành sử dụng động cơ SteadyWin

Phần cứng sử dụng khung thép gia công chắc chắn, kết hợp với vỏ nhựa nhằm tăng tính thẩm mỹ và độ bền vững cho hệ thống. 

Phần điều khiển được lập trình bằng ngôn ngữ C++ để đảm bảo hiệu suất và đáp ứng thời gian thực. Giao tiếp CAN giúp giảm nhiễu và tăng độ tin cậy cho tín hiệu điều khiển.

## Xây dựng mô hình

Lấy cảm hứng từ chuyển động tự nhiên của cánh tay người, quá trình thiết kế bắt đầu từ các mô hình nhỏ để thuận tiện cho việc tính toán động học thuận và động học ngược.

Mục tiêu là xây dựng một cái nhìn tổng quan về hệ thống robot và các thành phần cấu thành.

Từ những bước cơ bản, mô hình 3D được thiết kế bằng phần mềm SOLIDWORKS để phục vụ cho các giai đoạn tiếp theo.
![Mô hình 3D](/images/RehabRobot/3D.jpg)
<span style="font-size: 15px; font-style: italic; text-align: center; display: block;">
Mô hình 3D sau khi thiết kế
</span>


## Tiến hành mô phỏng 

Sau khi có bản thiết kế chính tiếp theo ta cần mô phỏng chúng bên cạnh mô phỏng về hình dạng, còn có hệ điều khiển cấu hình di chuyển 
Để thực hiện được điều này bảnh sử dụng một phần mềm mô phỏng GAZEBO kết hợp với RVIZ2. 

Các bước chi tiết để thực hiện điều này khá dài nên mình sẽ viết một blog riêng nhé.
<span style="font-size: 15px; font-style: italic; text-align: left; display: block;">
(ps thông cảm cho bảnh) 
</span>


Sau khi mô phỏng được thì có kết quả như sau:
![Mô hình 3D](/images/RehabRobot/simulation.jpg)
<span style="font-size: 15px; font-style: italic; text-align: center; display: block;">
Mô phỏng sử dụng Rviz2 
</span>


## Điều khiển 
Tương tự như mô hình mô phỏng để phù hợp với môi trường nghiên cứu, profile ít kinh nghiệm và đặc biệt là giảm thiểu chi phí (mất tiền ngu) thì bộ điều khiển cũng được mô phỏng 

Ở đây với Framework ROS2 bảnh dùng bộ điều khiển Ros2 Controller để sử dụng một bộ điều khiển ảo có sẵn hoặc viết một bộ điều khiển mới toanh như (HardWare Interface) -> nói chung cũng dài để sau nhé 

Phần mềm mô phỏng bộ điều khiển được xây dựng nhằm tái hiện sát nhất cách vận hành của một hệ thống điều khiển thực tế. Các chuyển động chính được xem xét bao gồm:

- **Chuyển động tịnh tiến**
- **Chuyển động quay**

Tuy đây là hai dạng chuyển động cơ bản, nhưng lại rất phổ biến trong thực tiễn và hầu hết các dự án robot hiện nay. Trong phạm vi dự án này, mình tập trung vào chuyển động quay, với các góc quay được giới hạn phù hợp với mục tiêu phục hồi chức năng.

Về mặt thiết kế, hệ thống tổng thể có thể hỗ trợ tới 4 khớp, tuy nhiên phiên bản hiện tại chỉ sử dụng 2 khớp chính: **khớp vai** và **khớp khuỷu**.

Cụ thể:
- Khớp vai: từ -90° đến 90°
- Khớp khuỷu: từ -90° đến 0°


Quên mất nói với mấy anh em góc quay âm là ngược chiều kim đồng hồ và ngược lại. 

<div style="display: flex; justify-content: center; align-items: center; margin: 24px 0;">
  <video controls width="800">
    <source src="/images/RehabRobot/TestAngle.webm" type="video/webm">
    Trình duyệt của bạn không hỗ trợ video.
  </video>
</div>
  <span style="font-size: 15px; font-style: italic; text-align: center; display: block;">
    Limited Joints. 
 </span>


## Path Planning
Sau khi có được giới hạn góc, ta tiến hành điều khiển từng góc là sự kết hợp nhuần nhuyễn giữa các khớp với nhau. 
Và cuối cùng phần khó nhất Path Planning trong ARM
Dễ hiểu là mình sẽ tìm đường dễ dàng nhất để đi từ nhà đến quán ăn gần nhất, hay circleK gần nhà nhất.
 

<div style="display: flex; justify-content: center; align-items: center; margin: 24px 0;">
  <video controls width="800">
    <source src="/images/RehabRobot/PlanningRehab.webm" type="video/webm">
    Trình duyệt của bạn không hỗ trợ video.
  </video>
</div>
  <span style="font-size: 15px; font-style: italic; text-align: center; display: block;">
    Planning and Excute trajectory. 
 </span>


## Nhận thức môi trường 
Tiếp theo đến phần nhận thức môi trường bảnh đang mong muốn sử dụng depth camera d435i tức camera có thể đo được chiều sâu theo môi trường 3D thay vì 2D như camera ta hay selfy.

![Mô hình 3D](/images/RehabRobot/octomap.png)
<span style="font-size: 15px; font-style: italic; text-align: center; display: block;">
Môi trường 3D sử dụng OCTOMAP.
Nguồn: Moveit2 
</span>

Ngoài ra còn nhiều lắm còn hardware, giao diện điều khiển thực và giao diện HMI mà bài này dài rồi nên hẹn anh em lần sau. Đây là demo bảnh đã thực hiện tại HUST phòng 719. 

<div style="display: flex; justify-content: center; align-items: center; margin: 24px 0;">
  <video controls width="800">
    <source src="/images/RehabRobot/Real.mp4" type="video/mp4">
    Trình duyệt của bạn không hỗ trợ video.
  </video>
</div>
  <span style="font-size: 15px; font-style: italic; text-align: center; display: block;">
    Rxperimental Path Planning. 
 </span>