---
layout: '../../layouts/Post.astro'
title: 'Một tầng thay nhiều tầng: MPC động lực học ngược toàn thân cho robot bốn chân vừa đi vừa thao tác'
description: 'Tóm tắt bài báo arXiv 2511.19709 của ETH Zurich: MPC toàn thân mức mô-men dựa trên động lực học ngược bậc đầy đủ, chạy real-time 80 Hz trên Unitree B2 + Z1, bỏ hẳn bộ điều khiển toàn thân cấp thấp, kéo được tải 10 kg.'
publishedAt: 2026-10-10
category: HUST
---

> **Bài báo:** *Whole-Body Inverse Dynamics MPC for Legged Loco-Manipulation*. Lukas Molnar, Jin Cheng, Gabriele Fadini, Dongho Kang, Fatemeh Zargarbashi, Stelian Coros (Computational Robotics Lab, ETH Zurich), arXiv 2511.19709, v1, 24/11/2025.

## Mở đầu: khi robot bốn chân cần thêm một cánh tay

Robot bốn chân giờ đi lại khá vững. Gắn thêm một cánh tay máy lên lưng thì nó có thể mở cửa, kéo đồ, lau bảng... Nhưng lúc đó bài toán điều khiển khó hơn hẳn. Cánh tay vừa phải bám vị trí chính xác, vừa phải tạo hoặc chịu lực lớn (kéo, đẩy vật nặng), mà robot vẫn phải giữ thăng bằng khi đang bước. Tay và thân ảnh hưởng qua lại rất mạnh: tay kéo mạnh thì thân bị kéo theo, chân phải bù lại.

Bài báo này của ETH Zurich đặt ra câu hỏi: **có thể gộp toàn bộ việc lập kế hoạch chuyển động và lực vào một bộ MPC duy nhất, dùng mô hình động lực học đầy đủ, mà vẫn chạy real-time trên robot thật không?** Câu trả lời của họ là có, ở 80 Hz.

## Vấn đề: kiến trúc phân tầng và những điểm yếu của nó

Cách làm phổ biến hiện nay là **phân tầng**:

1. Một MPC cấp cao dùng **mô hình rút gọn**, ví dụ khối cứng đơn (Single Rigid Body, SRB) hoặc mô hình centroidal, để lập kế hoạch.
2. Một **bộ điều khiển toàn thân (Whole-Body Controller, WBC)** cấp thấp nhận kế hoạch đó và tính ra mô-men cho từng khớp.

Cách này có ba nhược điểm:

- **Nhiều tầng phải tinh chỉnh**, và các tầng có thể "cãi nhau".
- **SRB giả định chân và tay không có khối lượng.** Giả định này sai khi tay máy đủ nặng.
- **Mô hình centroidal không đảm bảo khả thi ở mức khớp**, nên kế hoạch có thể đòi mô-men vượt giới hạn an toàn.

MPC toàn thân ở mức mô-men thì đã có cho bài toán đi bộ (locomotion). Với loco-manipulation, trước đây nó mới chỉ được giải **offline**, vì bài toán tối ưu có rất nhiều chiều.

## Phương pháp: MPC động lực học ngược toàn thân

### Ý tưởng trực quan

Thay vì hỏi "với mô-men này thì robot sẽ chuyển động ra sao?" (động lực học **thuận**), nhóm tác giả cho bộ tối ưu **tự chọn cùng lúc** gia tốc, mô-men khớp và lực tiếp xúc. Sau đó họ chỉ yêu cầu bộ ba này **thỏa mãn phương trình chuyển động** tại mỗi thời điểm, tức là kiểm tra bằng động lực học **ngược**. Nghe như thêm việc, vì có nhiều biến hơn, nhưng thực ra mỗi ràng buộc lại đơn giản hơn nhiều, và solver tận dụng được điều đó.

### Mô hình

Robot được mô hình là hệ floating-base với $q$ gồm vị trí base, quaternion base và góc các khớp. Phương trình chuyển động:

$$
M(q)\,a + b(q, v) = \begin{bmatrix} 0_{6\times1} \\ \tau_j \end{bmatrix} + J_c^\top F_c
$$

trong đó $M$ là ma trận quán tính, $b$ gồm lực Coriolis/ly tâm và trọng lực, $\tau_j$ là mô-men khớp, còn $F_c \in \mathbb{R}^{18}$ gộp lực tại 4 bàn chân và lực/mô-men tại tay. Số 0 ở hàng đầu nói lên rằng base "lơ lửng" và không có động cơ tác động trực tiếp lên nó.

Trạng thái và đầu vào của MPC:

$$
x = [q,\ v], \qquad u = [\tau_j,\ a,\ F_c]
$$

Điểm then chốt là **gia tốc $a$ và lực $F_c$ cũng là biến quyết định**, chứ không chỉ mô-men.

### Ràng buộc động lực học dạng "path constraint"

Phần động học được tích phân bằng Euler hiện trên số gia $\delta q$ trong không gian tiếp tuyến, nhờ vậy tránh được ràng buộc chuẩn hóa quaternion. Phần động lực học được áp như một **ràng buộc đường đi** tại mỗi nút $k$, tính bằng thuật toán RNEA (Recursive Newton-Euler):

$$
\begin{bmatrix} 0_{6\times1} \\ \tau_{j,k} \end{bmatrix} = f_{\mathrm{RNEA}}(q_k, v_k, a_k, F_{c,k})
$$

Dạng này tương đương với $M(q_k)a_k + b(q_k,v_k) - J_c^\top(q_k)F_{c,k}$.

RNEA là phép tính rất "rẻ", nên đồ thị tính toán của ràng buộc này nhỏ, và solver xử lý nhanh.

### Chi phí và các ràng buộc khác

- **Hàm chi phí bậc hai:** phạt độ lệch khỏi tư thế danh định, độ lệch khỏi vận tốc base được ra lệnh, điều chuẩn $a$ và $\tau$ về 0, và khuyến khích lực chia đều trên các chân đang chống.
- **Tiếp xúc theo lịch dáng đi cố định.** Chân chống: lực pháp tuyến không âm, nằm trong nón ma sát, vận tốc bàn chân bằng 0. Chân đang bước (swing): lực bằng 0, độ cao bám theo spline bậc ba. Vận tốc ngang được để tự do, nên **MPC tự quyết vị trí đặt chân**.
- **Tay:** lực và vận tốc end-effector bám theo lệnh người dùng. Vật thể không được mô hình hóa.
- **Giới hạn khớp:** giới hạn vị trí/vận tốc áp cho mọi nút. Giới hạn mô-men **chỉ áp cho 2 nút đầu** ($k \le 2$), sau đó bỏ $\tau$ khỏi biến quyết định để giảm kích thước bài toán.

### Bước thời gian thích nghi

Các bước thời gian dày ở đầu horizon (nơi cần chính xác) và thưa dần về cuối:

$$
\delta t_k = \gamma^k\, \delta t_0, \qquad \gamma > 1
$$

### Solver và các mẹo tăng tốc

- **Fatrop**, một solver interior-point khai thác cấu trúc thưa theo khối bằng Riccati recursion, dùng Hessian chính xác, có lúc chỉ cần 3 vòng lặp mỗi lần giải. Fatrop **nhanh hơn IPOPT hơn 10×**.
- **Warm-start** từ lời giải bước trước, có khởi tạo lại lực tiếp xúc bằng cách chia đều trọng lượng cho các chân chống. Cách này giảm thời gian giải **15%–20%**.
- **Sinh mã C** (qua Pinocchio + CasADi) thành shared library, tăng tốc **2–2.5×**.

### Pipeline trên robot

Robot là **Unitree B2** (khoảng 70 kg, 12 khớp) gắn tay **Z1** (4.5 kg, 6 khớp, khóa 2 khớp cuối), cho mô hình 22 bậc tự do. MPC chạy **80 Hz** trên CPU AMD Ryzen 9 9950X. Lời giải được nội suy lên 500 Hz rồi đưa vào một vòng PD đơn giản, **không cần WBC**:

$$
\tau_{\text{motor}} = \tau_{\text{ff}} + K_p (q_{\text{des}} - q) + K_d (v_{\text{des}} - v)
$$

## Thí nghiệm và kết quả chính

### "Nhiều biến hơn mà lại nhanh hơn"

Nhóm tác giả so sánh các mô hình MPC (15 nút, horizon 0.56 s, tức 70% chu kỳ gait). Bảng dưới là thời gian giải trung bình (độ lệch chuẩn):

| Mô hình | Path constraint | Biến quyết định | Trước biên dịch (ms) | Sau biên dịch (ms) |
|---|---|---|---|---|
| **Whole-Body Inverse Dyn. (đề xuất)** | ✓ | 1226 | 29.0 (0.9) | **12.5 (0.5)** |
| Whole-Body Forward Dyn. | ✗ | 1094 | 81.6 (9.2) | 34.2 (3.8) |
| Centroidal Velocity (path) | ✓ | 938 | 33.0 (1.9) | 16.0 (0.9) |
| Centroidal Velocity (trong f) | ✗ | 854 | 115.5 (14.5) | —* |
| Centroidal Accel. (path) | ✓ | 1178 | 103.7 (3.9) | —* |
| Centroidal Accel. (trong f) | ✗ | 1094 | 189.8 (18.0) | —* |

\* Biên dịch thất bại do hết bộ nhớ trên máy 32 GB RAM.

Nguồn: Table I của bài báo.

Phương pháp đề xuất có **nhiều biến nhất nhưng giải nhanh nhất**. Lý do là ràng buộc RNEA cần ít phép tính nhất (3818 lệnh, so với 7764 của forward dynamics), và Fatrop chạy tốt hẳn khi động lực học được viết dưới dạng path constraint.

### Mô phỏng

- **Chỉ dùng mô-men feed-forward** ($K_p = K_d = 0$, khi chưa tính trễ tính toán): robot trot về phía trước ở **0.2 m/s** trong khi bám quỹ đạo tay, và tự hạ/nâng thân để với tới mục tiêu thấp hoặc cao.
- **Chống nhiễu:** khi trot tại chỗ, vận tốc ngang của base bị nhiễu **0.8 m/s**. MPC ổn định lại, tay vẫn bám tốt, mô-men luôn trong giới hạn. Có lần khớp bắp chân sau trái chạm đúng giới hạn **320 N·m**. Cách phản ứng thay đổi theo pha gait: ở lần nhiễu thứ hai, chân sau phải phải đổi vị trí đặt chân khá nhiều.
- **Có tính trễ:** cần $K_d \approx 5$. Bước thời gian thích nghi (10–100 ms) cho độ trôi base **0.4 cm/s**, so với **1.2 cm/s** khi dùng bước cố định 40 ms trên cùng horizon.

### Phần cứng

- Trên robot thật cần $K_d \approx 20$ để tránh dao động động cơ tần số cao. Chân **không cần $K_p$**, cho thấy mô-men do MPC tính ra đã đủ tốt. Tay cần thêm một chút P vì cảm biến khớp nhiễu.
- **Kéo tải 10 kg** khi đứng và khi đi, trong khi tải định danh của tay Z1 chỉ **3–5 kg**. Trong mô phỏng kéo được tới 14 kg, nhưng ngoài đời khớp tay thứ 3 bị quá nhiệt.
- Còn có các demo khác: đẩy hộp vào tường khi trot tại chỗ, lau bảng trắng, tương tác mềm với người.

### Bài học sim-to-real

- Thời gian giải trên phần cứng dao động nhiều hơn, có lúc lên tới **20 ms** (trung bình trong mô phỏng là 12.5 ms).
- Chân chạm đất trễ gây đỉnh vận tốc ở khớp bắp chân sau trái (Fig. 6).
- URDF đặt CoM của base cách tâm hình học không quá 1 cm, nhưng đo thực tế thấy **trọng lượng lệch về phía sau khoảng 60%**. Sau khi sửa offset CoM, robot hết ngả về sau rõ rệt. Bài học: system identification không phải chuyện phụ.

## Hạn chế

- Lực và vận tốc tay là **lệnh từ bên ngoài**. Vật thể không được mô hình hóa, nên MPC không "hiểu" vật sẽ phản ứng thế nào.
- **Chưa đo lực thực tế** tác dụng lên vật, nên việc bám lực chưa được kiểm chứng.
- Lịch gait cố định. Chưa có ràng buộc tránh va chạm (cả thân robot lẫn tay).
- Mô hình bỏ qua ma sát động cơ và quán tính rotor. Thời điểm tiếp xúc giữa mô phỏng và thực tế không khớp.
- Giới hạn mô-men chỉ áp cho 2 nút đầu. Chỉ dùng 4/6 khớp tay. MPC chạy off-board trên CPU desktop mạnh.
- Chưa so sánh với SQP. Kết quả phần cứng chủ yếu là định tính.

## Điểm rút ra

1. **Một tầng có thể thay nhiều tầng:** MPC toàn thân mức mô-men chạy real-time, đưa thẳng xuống PD, không cần WBC.
2. **Cách viết bài toán quan trọng ngang mô hình:** động lực học ngược dạng path constraint nhanh hơn cả forward dynamics lẫn centroidal, dù có nhiều biến hơn.
3. **Mẹo kỹ thuật dùng được ngay:** bước thời gian thích nghi, Fatrop + warm-start + sinh mã, chỉ giới hạn mô-men ở các nút đầu.
4. **Rào cản thấp:** chỉ dùng công cụ mở (Pinocchio, CasADi, Fatrop), có code công khai, chạy trên phần cứng Unitree thương mại và CPU thường, không cần GPU hay dữ liệu lớn. Đây là một baseline model-based tốt cho các lab có Go2/B2 + Z1.
5. **Hướng tương lai:** kết hợp RL (bền vững với sai số mô hình) với MPC (lập kế hoạch cả lực lẫn chuyển động, có ràng buộc an toàn).

## Tham khảo

- Bài báo: [arXiv 2511.19709](https://arxiv.org/abs/2511.19709)
- Website dự án: <https://lukasmolnar.github.io/wb-mpc-locoman>
- Code: <https://github.com/lukasmolnar/wb-mpc-locoman>
