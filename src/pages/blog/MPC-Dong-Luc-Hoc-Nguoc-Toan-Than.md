---
layout: '../../layouts/Post.astro'
title: 'Whole-Body Inverse Dynamics MPC for Legged Loco-Manipulation'
description: 'Giải thích kiểu Feynman bài báo arXiv 2511.19709 (ETH Zurich): một bộ MPC toàn thân mức mô-men, dựa trên động lực học ngược, chạy real-time 80 Hz trên Unitree B2 + Z1, không cần bộ điều khiển toàn thân cấp thấp, kéo được tải 10 kg.'
publishedAt: 2026-10-10
image: /images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig1_standing_pulling
category: HUST
---

> **Bài báo:** *Whole-Body Inverse Dynamics MPC for Legged Loco-Manipulation*. Lukas Molnar, Jin Cheng, Gabriele Fadini, Dongho Kang, Fatemeh Zargarbashi, Stelian Coros (Computational Robotics Lab, ETH Zurich). arXiv 2511.19709, **phiên bản v1, 24/11/2025**, giấy phép **CC BY 4.0**. Toàn bộ hình trong bài lấy từ bài báo theo giấy phép này.

Bài này đi theo **phương pháp Feynman**: mỗi phần bắt đầu bằng một ví dụ đời thường, sau đó mới nói chính xác bằng ngôn ngữ kỹ thuật, và kết thúc bằng một đoạn **Tóm lại** đủ đơn giản để kể lại cho một người bạn không học robotics.

![Robot B2 + Z1 kéo tải 10 kg khi đứng](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig1_standing_pulling.png)

*Robot bốn chân Unitree B2 gắn tay máy Z1 kéo một tải 10 kg khi đang đứng (ảnh trên của Hình 1; hai ảnh dưới trong bài báo là đẩy hộp vào tường và tương tác mềm với người).*
Nguồn: Hình 1, arXiv 2511.19709

## 1. Câu chuyện: một con robot vừa đi vừa làm việc bằng tay

**Ví dụ đời thường.** Bạn hãy thử vừa đi bộ vừa kéo một vali nặng. Bạn không nghĩ riêng "chân đi thế nào" rồi mới nghĩ "tay kéo thế nào". Khi tay kéo mạnh, người bạn tự ngả về trước, bước chân tự ngắn lại hoặc đặt rộng ra. Tay và chân được điều phối như một thể thống nhất.

**Nói chính xác.** Robot bốn chân gắn tay máy phải làm đúng việc đó, gọi là *loco-manipulation* (vừa di chuyển vừa thao tác). Đầu công tác (end-effector) phải bám vị trí chính xác, phải tạo hoặc chịu lực lớn khi kéo, đẩy vật nặng, trong khi robot vẫn phải giữ ổn định lúc bước. Tay và thân liên kết động lực học rất mạnh: lực ở tay truyền ngược về thân, và chân phải bù lại.

Câu hỏi của bài báo: **có thể gộp việc lập kế hoạch chuyển động và lực cho toàn thân vào một bộ MPC duy nhất, dùng mô hình động lực học đầy đủ, mà vẫn chạy real-time trên robot thật không?** Nhóm tác giả trả lời là có, ở 80 Hz.

**Tóm lại:** robot cần điều phối tay và chân như người kéo vali, và bài báo muốn làm điều đó bằng một "bộ não" lập kế hoạch duy nhất, chạy đủ nhanh trên robot thật.

## 2. Vấn đề: kiến trúc phân tầng

**Ví dụ đời thường.** Hãy hình dung một công trường có hai người. Kỹ sư thiết kế (tầng trên) vẽ bản vẽ đơn giản hóa, coi toà nhà như một khối hộp. Đội thi công (tầng dưới) phải tự xoay xở biến bản vẽ đó thành từng viên gạch. Nếu bản vẽ bỏ qua chi tiết quan trọng, đội thi công có khi không làm nổi, và hai bên phải "chỉnh qua chỉnh lại" mãi.

**Nói chính xác.** Cách làm phổ biến có hai tầng:

1. **MPC cấp cao dùng mô hình rút gọn**: khối cứng đơn (Single Rigid Body, SRB) hoặc mô hình centroidal.
2. **Bộ điều khiển toàn thân (Whole-Body Controller, WBC) cấp thấp** biến kế hoạch đó thành mô-men cho từng khớp.

Kiến trúc này có ba điểm yếu:

- **Hai tầng phải tinh chỉnh riêng**, và có thể mâu thuẫn với nhau.
- **SRB giả định chân và tay không có khối lượng**, điều sai khi tay máy đủ nặng.
- **Mô hình centroidal không đảm bảo khả thi ở mức khớp**, nên kế hoạch có thể đòi mô-men không an toàn.

MPC toàn thân ở mức mô-men đã chạy được cho bài toán chỉ đi bộ (locomotion). Với loco-manipulation, công trình trước đó mới giải được **offline**, vì bài toán tối ưu có quá nhiều chiều.

**Tóm lại:** chia việc cho "kỹ sư vẽ phác" và "đội thi công" thì nhanh, nhưng bản phác bỏ qua khối lượng của tay chân và giới hạn của từng khớp. Gộp hết vào một tầng thì chính xác hơn, nhưng trước đây lại quá chậm để chạy thật.

## 3. Ý tưởng cốt lõi: thay vì "dự đoán", hãy "kiểm tra"

**Ví dụ đời thường.** Có hai cách giải một ô Sudoku. Cách một: thử điền một số, rồi lần theo hệ quả xem cả bảng biến đổi ra sao (đây là "dự đoán"). Cách hai: đoán cùng lúc vài ô, rồi chỉ **kiểm tra** từng hàng, từng cột có hợp lệ không. Kiểm tra thì dễ và nhanh hơn nhiều so với lần theo hệ quả.

**Nói chính xác.** Động lực học **thuận** (forward dynamics) hỏi: "với mô-men này, robot sẽ có gia tốc bao nhiêu?". Theo Table I, dạng này đắt hơn và cho đồ thị tính toán lớn hơn (7764 so với 3818 lệnh cho mỗi ràng buộc). Bài báo dùng động lực học **ngược** (inverse dynamics): để bộ tối ưu **tự chọn cùng lúc** mô-men khớp, gia tốc và lực tiếp xúc, rồi chỉ yêu cầu bộ ba này **thỏa mãn phương trình chuyển động** tại mỗi thời điểm. Có nhiều biến hơn, nhưng mỗi ràng buộc lại "rẻ" hơn.

**Tóm lại:** đừng bắt máy tính mô phỏng trước robot sẽ làm gì. Hãy để nó đoán cả mô-men, gia tốc và lực, rồi kiểm tra xem chúng có khớp định luật Newton không.

## 4. Phương pháp chi tiết

### 4.1. Mô hình robot

**Ví dụ đời thường.** Thân robot giống một chiếc thuyền trôi trên mặt nước: không có động cơ nào gắn trực tiếp vào "nước" để đẩy thân đi. Muốn thân di chuyển, robot chỉ có thể đạp chân xuống đất và dùng tay đẩy vào vật.

**Nói chính xác.** Robot được mô hình là hệ *floating-base*, với $q$ gồm vị trí base, quaternion base và góc các khớp. Phương trình chuyển động (Eq. 2 trong bài báo):

$$
M(q)\,a + b(q, v) = \begin{bmatrix} 0_{6\times1} \\ \tau_j \end{bmatrix} + J_c^\top F_c
$$

Ở đây $M$ là ma trận quán tính, $b$ gộp các lực Coriolis/ly tâm và trọng lực, $\tau_j$ là mô-men khớp, $F_c \in \mathbb{R}^{18}$ gộp lực tại 4 bàn chân và lực/mô-men tại tay. Khối $0_{6\times1}$ chính là "chiếc thuyền": 6 bậc tự do của base không có động cơ tác động trực tiếp.

Trạng thái và đầu vào của MPC:

$$
x = [q,\ v], \qquad u = [\tau_j,\ a,\ F_c]
$$

**Tóm lại:** thân robot chỉ chuyển động được nhờ lực từ chân và tay, và điểm mấu chốt là MPC coi cả gia tốc $a$ lẫn lực $F_c$ là biến để chọn, chứ không chỉ mô-men.

### 4.2. Động lực học ngược làm "ràng buộc đường đi"

**Ví dụ đời thường.** Thay vì một thanh tra đi theo cả dây chuyền để dự đoán sản phẩm cuối, mỗi trạm trên dây chuyền có một người kiểm tra tại chỗ: "ở trạm này, mọi thứ có khớp nhau không?". Mỗi lần kiểm tra nhỏ, độc lập, nên nhanh.

**Nói chính xác.** Phần động học được tích phân bằng Euler hiện trên số gia $\delta q$ trong không gian tiếp tuyến, tránh được ràng buộc chuẩn hóa quaternion. Phần động lực học được áp như một **ràng buộc đường đi (path constraint)** tại mỗi nút $k$, tính bằng thuật toán RNEA (Recursive Newton-Euler), đúng như Eq. 5 của bài báo:

$$
\begin{bmatrix} 0_{6\times1} \\ \tau_{j,k} \end{bmatrix} = f_{\mathrm{RNEA}}(q_k, v_k, a_k, F_{c,k})
$$

Dạng này tương đương với $M(q_k)a_k + b(q_k,v_k) - J_c^\top(q_k)F_{c,k}$. RNEA rất "rẻ", nên đồ thị tính toán của ràng buộc nhỏ, và solver tận dụng được cấu trúc này.

**Tóm lại:** ở mỗi nút thời gian có một "trạm kiểm tra Newton" nhỏ và rẻ, thay vì một phép mô phỏng nặng nề.

### 4.3. Chi phí, tiếp xúc và tay máy

**Ví dụ đời thường.** Khi bước đi, bàn chân đang chạm đất thì không được trượt, còn bàn chân đang nhấc lên thì không chịu lực. Bạn không cần ai chỉ chỗ đặt chân, cơ thể tự tìm chỗ hợp lý.

**Nói chính xác.**

- **Hàm chi phí bậc hai:** phạt độ lệch khỏi tư thế danh định, độ lệch khỏi vận tốc base được ra lệnh, điều chuẩn $a$ và $\tau$ về 0, và khuyến khích lực chia đều trên các chân đang chống.
- **Tiếp xúc theo lịch dáng đi (gait) cố định.** Chân chống: lực pháp tuyến không âm, nằm trong nón ma sát, vận tốc bàn chân bằng 0. Chân swing: lực bằng 0, độ cao bám theo spline bậc ba. Vận tốc ngang để tự do, nên **MPC tự quyết vị trí đặt chân**.
- **Tay:** lực và vận tốc end-effector bám theo lệnh người dùng. Vật thể không được mô hình hóa.

**Tóm lại:** quy tắc "chân chạm đất không trượt, chân nhấc lên không chịu lực" được viết thành ràng buộc, còn chỗ đặt chân thì MPC tự tính.

### 4.4. Giới hạn mô-men chỉ ở đầu horizon

**Ví dụ đời thường.** Khi lên lịch cho cả tuần, bạn chỉ cần chi tiết từng phút cho vài giờ tới, vì đó là việc sắp làm thật. Các ngày sau chỉ cần đại khái, đằng nào ngày mai bạn cũng lập lại kế hoạch.

**Nói chính xác.** Giới hạn vị trí và vận tốc khớp áp cho mọi nút. Giới hạn mô-men chỉ áp cho $k \le 2$ (bài báo viết "first 2 time steps"), vì mô-men gửi xuống robot chỉ được nội suy tới $k = 2$. Sau nút đó, $\tau$ được bỏ hẳn khỏi biến quyết định, và tính khả thi động lực học vẫn được giữ nhờ **6 hàng đầu** của ràng buộc RNEA (phần $0_{6\times1}$).

**Tóm lại:** chỉ kiểm giới hạn mô-men ở đoạn sắp thực thi, còn phần sau vẫn tuân thủ vật lý nhờ 6 phương trình của base.

### 4.5. Bước thời gian thích nghi

**Ví dụ đời thường.** Khi lái xe, bạn nhìn rất kỹ vài mét trước mũi xe, còn đoạn đường xa chỉ cần liếc qua.

**Nói chính xác.** Bước thời gian dày ở đầu horizon và thưa dần về cuối:

$$
\delta t_k = \gamma^k\, \delta t_0, \qquad \gamma > 1
$$

**Tóm lại:** nhìn kỹ chỗ gần, nhìn thoáng chỗ xa, để cùng một số nút mà thấy được xa hơn.

### 4.6. Solver và các mẹo tăng tốc

**Ví dụ đời thường.** Một thủ thư giỏi không lục cả thư viện, vì biết sách xếp theo kệ nên chỉ đi dọc từng kệ. Hôm sau, họ bắt đầu từ chỗ đã tìm hôm qua thay vì từ đầu.

**Nói chính xác.**

- **Fatrop:** solver interior-point khai thác cấu trúc thưa theo khối (từng nút thời gian) bằng Riccati recursion, dùng Hessian chính xác, có lúc chỉ cần 3 vòng lặp mỗi lần giải. Fatrop **nhanh hơn IPOPT hơn 10×**.
- **Warm-start** từ lời giải bước trước, có khởi tạo lại lực tiếp xúc bằng cách chia đều trọng lượng cho các chân chống: giảm thời gian giải **15%–20%**.
- **Sinh mã C** (qua Pinocchio + CasADi) thành shared library: tăng tốc **2–2.5×**.

**Tóm lại:** solver "biết" bài toán xếp theo từng nút thời gian, bắt đầu từ lời giải cũ, và được biên dịch sẵn, nên đủ nhanh cho real-time.

### 4.7. Pipeline trên robot thật

![Sơ đồ pipeline MPC động lực học ngược toàn thân](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig2_pipeline.png)

*MPC (80 Hz) nhận lệnh base/tay, lịch gait và trạng thái từ bộ ước lượng (500 Hz), xuất quỹ đạo τ\*, q\*, v\*; quỹ đạo được nội suy ở 500 Hz thành q_des, v_des, τ_ff rồi vào vòng PD mức khớp, không qua WBC.*
Nguồn: Hình 2, arXiv 2511.19709

**Ví dụ đời thường.** Nhạc trưởng (MPC) viết sẵn từng nốt cho từng nhạc công, nên nhạc công (vòng PD) chỉ cần chơi theo và chỉnh nhẹ khi lệch, không cần thêm một "phó nhạc trưởng" (WBC) ở giữa.

**Nói chính xác.** Robot là **Unitree B2** (khoảng 70 kg, 12 khớp) gắn tay **Z1** (4.5 kg, 6 khớp, khóa 2 khớp cuối), cho mô hình 22 bậc tự do. MPC chạy **80 Hz** trên CPU AMD Ryzen 9 9950X. Lời giải được nội suy tuyến tính lên 500 Hz rồi đưa vào vòng PD (Eq. 10):

$$
\tau_{\text{motor}} = \tau_{\text{ff}} + K_p (q_{\text{des}} - q) + K_d (v_{\text{des}} - v)
$$

**Tóm lại:** chỉ còn hai thứ: một MPC duy nhất và một vòng PD đơn giản ở từng khớp. Tầng WBC đã biến mất.

## 5. Thí nghiệm và kết quả

### 5.1. Nhiều biến hơn mà lại nhanh hơn

**Ví dụ đời thường.** Một bài kiểm tra 100 câu trắc nghiệm ngắn có thể làm xong nhanh hơn 50 câu tự luận dài. Số câu nhiều hơn không có nghĩa là khó hơn.

**Nói chính xác.** Nhóm tác giả so sánh các cách viết mô hình (15 nút, horizon 0.56 s, tức 70% chu kỳ gait), thời gian giải trung bình (độ lệch chuẩn):

| Mô hình | Path constraint | Số lệnh/ràng buộc | Biến quyết định | Trước biên dịch (ms) | Sau biên dịch (ms) |
|---|---|---|---|---|---|
| **Whole-Body Inverse Dyn. (đề xuất)** | ✓ | 3818 | 1226 | 29.0 (0.9) | **12.5 (0.5)** |
| Whole-Body Forward Dyn. | ✗ | 7764 | 1094 | 81.6 (9.2) | 34.2 (3.8) |
| Centroidal Velocity (path) | ✓ | 4070 | 938 | 33.0 (1.9) | 16.0 (0.9) |
| Centroidal Velocity (trong f) | ✗ | 4727 | 854 | 115.5 (14.5) | —* |
| Centroidal Accel. (path) | ✓ | 15628 | 1178 | 103.7 (3.9) | —* |
| Centroidal Accel. (trong f) | ✗ | 16339 | 1094 | 189.8 (18.0) | —* |

\* Biên dịch thất bại do hết bộ nhớ trên máy 32 GB RAM.

Nguồn: Table I, arXiv 2511.19709

Phương pháp đề xuất có **nhiều biến nhất nhưng giải nhanh nhất**: ràng buộc RNEA cần ít lệnh nhất (3818, so với 7764 của forward dynamics), và Fatrop chạy tốt hẳn khi động lực học được viết dạng path constraint.

**Tóm lại:** 12.5 ms mỗi lần giải, đủ cho 80 Hz. Cái quyết định tốc độ là độ "rẻ" của từng ràng buộc, không phải số biến.

### 5.2. Mô phỏng: phối hợp toàn thân và chống nhiễu

![Robot tự hạ/nâng thân để bám quỹ đạo tay khi trot](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig3_arm_tracking.png)

*Phối hợp toàn thân: khi đang trot, MPC tự hạ hoặc nâng thân để tay với tới mục tiêu thấp và cao.*
Nguồn: Hình 3, arXiv 2511.19709

**Ví dụ đời thường.** Bạn đang đi thì có người xô ngang vai. Bạn không ngã, vì chân tự bước sang một bên để đỡ, mà tay vẫn cầm chắc cốc cà phê.

**Nói chính xác.**

- **Chỉ dùng mô-men feed-forward** ($K_p = K_d = 0$, khi chưa tính trễ tính toán): robot trot về phía trước ở **0.2 m/s** trong khi bám quỹ đạo tay, tự hạ/nâng thân để với tới mục tiêu.
- **Chống nhiễu:** khi trot tại chỗ, **vận tốc ngang của base bị nhiễu 0.8 m/s** (đây là nhiễu vận tốc, không phải lực đẩy). MPC ổn định lại, tay vẫn bám tốt, mô-men luôn trong giới hạn; có lần khớp bắp chân sau trái chạm đúng giới hạn **320 N·m**. Phản ứng phụ thuộc pha gait: ở lần nhiễu thứ hai, chân sau phải đổi vị trí đặt chân khá nhiều.
- **Có tính trễ tính toán:** cần $K_d \approx 5$. Bước thời gian thích nghi (10–100 ms) cho độ trôi base **0.4 cm/s**, so với **1.2 cm/s** khi dùng bước cố định 40 ms trên cùng horizon.

![Chống nhiễu vận tốc ngang 0.8 m/s](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig4_base_disturbance.png)

*Chống nhiễu: vận tốc ngang của base bị nhiễu 0.8 m/s khi trot tại chỗ. Đồ thị cho thấy vận tốc ngang của end-effector và base, cùng mô-men khớp bắp chân hai chân sau (RL và RR).*
Nguồn: Hình 4, arXiv 2511.19709

**Tóm lại:** trong mô phỏng, chỉ riêng mô-men MPC tính ra đã đủ cho robot vừa đi vừa bám tay, và bị xô vẫn đứng vững mà không vượt giới hạn mô-men.

### 5.3. Phần cứng: tay 3–5 kg kéo 10 kg

![Kéo tải 10 kg khi đang đi](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig5_walking_pulling.png)

*Kéo tải 10 kg trong khi đang đi (ảnh trái của Hình 5).*
Nguồn: Hình 5, arXiv 2511.19709

![Lau bảng trắng chính xác](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig5_board_wiping.png)

*Lau bảng trắng chính xác (ảnh phải của Hình 5).*
Nguồn: Hình 5, arXiv 2511.19709

**Ví dụ đời thường.** Một người bê đồ nặng bằng cả cơ thể (dồn trọng tâm, trụ chân) sẽ bê được nhiều hơn người chỉ dùng sức cánh tay.

**Nói chính xác.**

- Trên robot thật cần $K_d \approx 20$ để tránh dao động động cơ tần số cao. Chân **không cần $K_p$**, cho thấy mô-men MPC đã đủ tốt. Tay cần thêm một chút P vì cảm biến khớp nhiễu.
- **Kéo tải 10 kg** khi đứng và khi đi, trong khi tải định danh của tay Z1 chỉ **3–5 kg**. Mô phỏng kéo được tới **14 kg**, nhưng ngoài đời khớp tay thứ 3 bị quá nhiệt.
- Các demo khác: đẩy hộp vào tường khi trot tại chỗ, lau bảng trắng, tương tác mềm với người.

**Tóm lại:** nhờ dùng cả thân, cánh tay 3–5 kg kéo được 10 kg trên robot thật. Giới hạn lúc này là nhiệt độ của động cơ tay, không phải bộ điều khiển.

### 5.4. Bài học sim-to-real

![So sánh mô phỏng và phần cứng ở khớp bắp chân sau trái](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig6_sim_vs_hw.png)

*Mô-men và vận tốc của khớp bắp chân sau trái khi trot: (a) mô phỏng, bên trái; (b) phần cứng, bên phải.*
Nguồn: Hình 6, arXiv 2511.19709

**Ví dụ đời thường.** Bạn tập đi trên sàn phẳng trong nhà, rồi ra đường mới phát hiện đôi giày mới hơi lệch đế. Không sửa đôi giày thì đi mãi vẫn thấy ngả về sau.

**Nói chính xác.**

- Thời gian giải trên phần cứng dao động nhiều hơn, có lúc lên tới **20 ms** (trung bình trong mô phỏng là 12.5 ms).
- Ở khớp bắp chân sau trái (Hình 6), phần cứng có **đỉnh vận tốc do chân chạm đất trễ** so với lịch gait.
- URDF đặt CoM của base cách tâm hình học không quá 1 cm, nhưng đo thực tế thấy **trọng lượng lệch về phía sau khoảng 60%**. Sau khi sửa offset CoM và mục tiêu lực tiếp xúc, robot ngả về sau ít hẳn, và mọi kết quả trong bài báo đều dùng bản đã sửa.

**Tóm lại:** mô hình chỉ tốt bằng dữ liệu nạp vào nó. Một sai lệch khối lượng trong URDF đủ để robot ngả về sau, nên system identification là bắt buộc.

## 6. Hạn chế

**Ví dụ đời thường.** Một tài xế giỏi nhưng bị bịt mắt về hàng hóa phía sau: họ biết mình đang kéo mạnh cỡ nào, nhưng không biết thùng hàng sẽ trượt ra sao.

**Nói chính xác.**

- Lực và vận tốc tay là **lệnh từ bên ngoài**. Vật thể không được mô hình hóa, nên MPC không suy luận được vật sẽ phản ứng thế nào.
- **Chưa đo lực thực tế** tác dụng lên vật (thiếu thiết bị), nên việc bám lực chưa được kiểm chứng.
- Lịch gait cố định. Chưa có ràng buộc tránh va chạm (cả thân robot lẫn tay).
- Mô hình bỏ qua ma sát động cơ và quán tính rotor. Thời điểm tiếp xúc giữa mô phỏng và thực tế không khớp. Mô hình khối lượng sai lệch, cần system identification bài bản hơn.
- Giới hạn mô-men chỉ áp cho $k \le 2$. Chỉ dùng 4/6 khớp tay. MPC chạy off-board trên CPU desktop mạnh.
- Tải bị giới hạn bởi nhiệt của khớp tay. Thời gian giải trên phần cứng biến động.
- Chưa so sánh với SQP. Kết quả phần cứng chủ yếu là định tính.

**Tóm lại:** bộ điều khiển rất mạnh về phía robot, nhưng còn "mù" về vật thể, chưa đo được lực thật, và vẫn cần một máy tính mạnh đặt ngoài robot.

## 7. Điểm rút ra

**Ví dụ đời thường.** Đây giống một công thức nấu ăn hay mà nguyên liệu mua được ở chợ: không cần dụng cụ đắt tiền, chỉ cần làm đúng thứ tự.

**Nói chính xác.**

1. **Một tầng thay hai tầng:** MPC toàn thân mức mô-men chạy real-time, đưa thẳng xuống PD, không cần WBC.
2. **Cách viết bài toán quan trọng ngang mô hình:** động lực học ngược dạng path constraint nhanh hơn cả forward dynamics lẫn centroidal, dù có nhiều biến hơn (Table I).
3. **Mẹo dùng được ngay:** bước thời gian thích nghi, Fatrop + warm-start + sinh mã, chỉ giới hạn mô-men ở các nút đầu.
4. **Rào cản thấp:** chỉ dùng công cụ mở (Pinocchio, CasADi, Fatrop), có code công khai, chạy trên phần cứng Unitree thương mại và một CPU desktop, không cần GPU hay dữ liệu lớn. Đây là một baseline model-based tốt cho các lab có Go2/B2 + Z1.
5. **Hướng tương lai:** kết hợp RL (bền vững với sai số mô hình nhờ domain randomization) với MPC (lập kế hoạch cả lực lẫn chuyển động, có ràng buộc an toàn).

**Tóm lại:** nếu phải kể trong một câu: *hãy để một bộ MPC duy nhất đoán cả mô-men, gia tốc và lực, rồi chỉ kiểm tra chúng bằng định luật Newton, vừa chính xác hơn mà lại nhanh hơn*.

## Tham khảo

- Bài báo: [arXiv 2511.19709 (v1, CC BY 4.0)](https://arxiv.org/abs/2511.19709)
- Website dự án: <https://lukasmolnar.github.io/wb-mpc-locoman>
- Code: <https://github.com/lukasmolnar/wb-mpc-locoman>
