---
layout: '../../layouts/Post.astro'
title: 'Whole-Body Inverse Dynamics MPC for Legged Loco-Manipulation'
description: 'Bài báo arXiv 2511.19709 (ETH Zurich) đề xuất một bộ MPC toàn thân mức mô-men, dựa trên động lực học ngược, chạy real-time 80 Hz trên Unitree B2 + Z1, không cần bộ điều khiển toàn thân cấp thấp, kéo được tải 10 kg.'
publishedAt: 2026-10-10
image: /images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig1_standing_pulling
alt: Robot Unitree B2 gắn tay Z1 kéo tải 10 kg khi đứng
category: HUST
---

## 1. Loco-manipulation cần điều phối toàn thân, và kiến trúc phân tầng không còn đủ

**Ví dụ.** Một người vừa đi vừa kéo vali nặng không điều khiển tay và chân một cách tách biệt: khi tay kéo mạnh, thân tự ngả về trước và bước chân tự điều chỉnh.

Robot bốn chân gắn tay máy đối mặt với đúng bài toán này, gọi là *loco-manipulation*. Đầu công tác (end-effector) phải bám vị trí chính xác và tạo hoặc chịu lực lớn khi kéo, đẩy vật nặng, trong khi robot vẫn phải giữ ổn định khi di chuyển. Do tay và thân liên kết động lực học chặt chẽ, lực ở tay truyền ngược về thân và phải được các chân bù lại.

**Ví dụ.** Trên một công trường, kỹ sư vẽ bản thiết kế đơn giản hóa, còn đội thi công phải tự biến nó thành từng viên gạch. Khi bản vẽ bỏ qua chi tiết quan trọng, hai bên phải điều chỉnh qua lại nhiều lần.

Kiến trúc phổ biến hiện nay gồm hai tầng: một MPC cấp cao dùng mô hình rút gọn (khối cứng đơn, SRB, hoặc mô hình centroidal) để lập kế hoạch, và một bộ điều khiển toàn thân (WBC) cấp thấp chuyển kế hoạch thành mô-men khớp. Cách tiếp cận này có ba nhược điểm. Thứ nhất, hai tầng phải được tinh chỉnh riêng và có thể mâu thuẫn nhau. Thứ hai, SRB giả định chân và tay không có khối lượng, giả định không còn đúng khi tay máy đủ nặng. Thứ ba, mô hình centroidal không đảm bảo tính khả thi ở mức khớp, nên kế hoạch có thể đòi hỏi mô-men không an toàn. MPC toàn thân ở mức mô-men đã được áp dụng cho bài toán chỉ di chuyển (locomotion), nhưng với loco-manipulation, công trình trước đó mới giải được offline do số chiều của bài toán tối ưu quá lớn.

Bài báo đặt câu hỏi: liệu có thể gộp lập kế hoạch chuyển động và lực cho toàn thân vào **một bộ MPC duy nhất** dùng động lực học bậc đầy đủ, mà vẫn chạy real-time trên robot thật? Câu trả lời của nhóm tác giả là có, ở 80 Hz.

![Minh họa so sánh kiến trúc phân tầng và MPC toàn thân một tầng](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/minhhoa_kien_truc.png)

*Bên trái là kiến trúc phân tầng truyền thống (MPC rút gọn, WBC, rồi PD); bên phải là cách tiếp cận của bài báo, trong đó một MPC toàn thân đưa lời giải thẳng xuống vòng PD mức khớp.*
Minh họa

**Tóm lại:** loco-manipulation đòi hỏi điều phối tay và chân như một thể thống nhất. Kiến trúc hai tầng nhanh nhưng dựa trên mô hình rút gọn thiếu chính xác, còn MPC toàn thân trước đây quá chậm để chạy real-time.

## 2. Ý tưởng cốt lõi: kiểm tra động lực học ngược thay vì mô phỏng động lực học thuận

**Ví dụ.** Có hai cách giải Sudoku: điền thử một ô rồi lần theo hệ quả trên toàn bảng, hoặc đoán cùng lúc nhiều ô rồi chỉ kiểm tra tính hợp lệ của từng hàng, từng cột. Kiểm tra thường rẻ hơn nhiều so với lần theo hệ quả.

Động lực học thuận (forward dynamics) trả lời câu hỏi "với mô-men này, robot sẽ có gia tốc bao nhiêu?". Theo Table I, dạng này đắt hơn và cho đồ thị tính toán lớn hơn (7764 so với 3818 lệnh cho mỗi ràng buộc). Bài báo thay vào đó dùng động lực học ngược (inverse dynamics): bộ tối ưu chọn đồng thời mô-men khớp, gia tốc và lực tiếp xúc, và chỉ yêu cầu bộ ba này thỏa mãn phương trình chuyển động tại mỗi thời điểm. Số biến tăng lên, nhưng mỗi ràng buộc trở nên rẻ hơn.

**Ví dụ.** Thân robot giống một chiếc thuyền trên mặt nước: không có động cơ nào tác động trực tiếp lên nó, và nó chỉ chuyển động nhờ lực đạp của chân xuống đất và lực của tay lên vật.

Robot được mô hình là hệ *floating-base*, với $q$ gồm vị trí base, quaternion base và góc khớp. Phương trình chuyển động (Eq. 2 trong bài báo) là

$$
M(q)\,a + b(q, v) = \begin{bmatrix} 0_{6\times1} \\ \tau_j \end{bmatrix} + J_c^\top F_c ,
$$

trong đó $M$ là ma trận quán tính, $b$ gộp các số hạng Coriolis/ly tâm và trọng lực, $\tau_j$ là mô-men khớp, và $F_c \in \mathbb{R}^{18}$ gộp lực tại bốn bàn chân cùng lực/mô-men tại tay. Khối $0_{6\times1}$ biểu diễn sáu bậc tự do không được dẫn động của base. Trạng thái và đầu vào của MPC là

$$
x = [q,\ v], \qquad u = [\tau_j,\ a,\ F_c],
$$

tức là gia tốc $a$ và lực $F_c$ cũng là biến quyết định, không chỉ mô-men.

**Ví dụ.** Thay vì một thanh tra theo dõi cả dây chuyền để dự đoán sản phẩm cuối, mỗi trạm có một người kiểm tra tại chỗ xem mọi thứ có khớp nhau không.

Phần động học được tích phân bằng Euler hiện trên số gia $\delta q$ trong không gian tiếp tuyến, nhờ đó tránh được ràng buộc chuẩn hóa quaternion. Phần động lực học được áp như một **ràng buộc đường đi (path constraint)** tại mỗi nút $k$, tính bằng thuật toán RNEA (Recursive Newton-Euler), theo đúng Eq. 5 của bài báo:

$$
\begin{bmatrix} 0_{6\times1} \\ \tau_{j,k} \end{bmatrix} = f_{\mathrm{RNEA}}(q_k, v_k, a_k, F_{c,k})
$$

Dạng này tương đương với $M(q_k)a_k + b(q_k,v_k) - J_c^\top(q_k)F_{c,k}$. Vì RNEA có chi phí tính toán thấp, đồ thị tính toán của ràng buộc nhỏ và solver khai thác được cấu trúc theo từng nút.

**Tóm lại:** thay vì mô phỏng trước robot sẽ làm gì, MPC chọn cùng lúc mô-men, gia tốc và lực, rồi kiểm tra chúng bằng một ràng buộc Newton rẻ tại từng nút thời gian.

## 3. Thiết kế bài toán tối ưu: chi phí, tiếp xúc, giới hạn và bước thời gian

**Ví dụ.** Khi bước đi, bàn chân đang chạm đất không được trượt, còn bàn chân đang nhấc lên không chịu lực; không ai phải chỉ cho ta chỗ đặt chân.

Hàm chi phí bậc hai phạt độ lệch khỏi tư thế danh định và khỏi vận tốc base được ra lệnh, điều chuẩn $a$ và $\tau$ về 0, và khuyến khích lực chia đều trên các chân đang chống. Tiếp xúc tuân theo một lịch dáng đi (gait) cố định. Với chân chống, lực pháp tuyến không âm, nằm trong nón ma sát và vận tốc bàn chân bằng 0. Với chân swing, lực bằng 0 và độ cao bám theo spline bậc ba. Vận tốc ngang của bàn chân được để tự do, nên **MPC tự xác định vị trí đặt chân**. Với tay, lực và vận tốc end-effector bám theo lệnh người dùng; vật thể không được mô hình hóa.

**Ví dụ.** Khi lên kế hoạch cho cả tuần, ta chỉ cần chi tiết vài giờ tới, vì kế hoạch cho các ngày sau sẽ được lập lại.

Giới hạn vị trí và vận tốc khớp được áp cho mọi nút. Giới hạn mô-men chỉ áp cho $k \le 2$ (bài báo viết "first 2 time steps"), vì mô-men gửi xuống robot chỉ được nội suy tới $k = 2$. Sau nút này, $\tau$ được loại khỏi biến quyết định, và tính khả thi động lực học vẫn được đảm bảo nhờ **sáu hàng đầu** của ràng buộc RNEA (phần $0_{6\times1}$).

**Ví dụ.** Khi lái xe, ta quan sát kỹ đoạn đường ngay phía trước và chỉ liếc qua đoạn đường xa.

Bước thời gian được chọn dày ở đầu horizon và thưa dần về cuối:

$$
\delta t_k = \gamma^k\, \delta t_0, \qquad \gamma > 1 .
$$

**Tóm lại:** các quy tắc tiếp xúc được viết thành ràng buộc, vị trí đặt chân do MPC tự tìm, giới hạn mô-men chỉ kiểm tra ở đoạn sắp thực thi, và bước thời gian thích nghi giúp nhìn xa hơn với cùng số nút.

## 4. Từ lời giải đến robot: solver khai thác cấu trúc và pipeline không cần WBC

**Ví dụ.** Một thủ thư giỏi biết sách được xếp theo kệ nên chỉ đi dọc từng kệ, và hôm sau bắt đầu tìm từ chỗ đã dừng hôm trước.

Solver được dùng là **Fatrop**, một solver interior-point khai thác cấu trúc thưa theo khối (theo từng nút thời gian) bằng Riccati recursion và dùng Hessian chính xác; có lúc chỉ cần 3 vòng lặp mỗi lần giải. Fatrop **nhanh hơn IPOPT hơn 10×**. Warm-start từ lời giải bước trước, kết hợp khởi tạo lại lực tiếp xúc bằng cách chia đều trọng lượng cho các chân chống, giảm thời gian giải **15%–20%**. Sinh mã C (qua Pinocchio + CasADi) thành shared library tăng tốc thêm **2–2.5×**.

![Sơ đồ pipeline MPC động lực học ngược toàn thân](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig2_pipeline.png)

*MPC (80 Hz) nhận lệnh base/tay, lịch gait và trạng thái từ bộ ước lượng (500 Hz), xuất quỹ đạo τ\*, q\*, v\*; quỹ đạo được nội suy ở 500 Hz thành q_des, v_des, τ_ff rồi vào vòng PD mức khớp, không qua WBC.*
Nguồn: Hình 2, arXiv 2511.19709

**Ví dụ.** Một nhạc trưởng viết sẵn từng nốt cho từng nhạc công, nên nhạc công chỉ cần chơi theo và chỉnh nhẹ khi lệch, không cần thêm một "phó nhạc trưởng" ở giữa.

Hệ thống thử nghiệm gồm **Unitree B2** (khoảng 70 kg, 12 khớp) gắn tay **Z1** (4.5 kg, 6 khớp, khóa 2 khớp cuối), cho mô hình 22 bậc tự do. MPC chạy ở **80 Hz** trên CPU AMD Ryzen 9 9950X. Lời giải được nội suy tuyến tính lên 500 Hz và đưa vào vòng PD (Eq. 10):

$$
\tau_{\text{motor}} = \tau_{\text{ff}} + K_p (q_{\text{des}} - q) + K_d (v_{\text{des}} - v) .
$$

**Tóm lại:** nhờ solver khai thác cấu trúc, warm-start và sinh mã, MPC đủ nhanh để đưa lời giải thẳng xuống vòng PD; tầng WBC bị loại bỏ hoàn toàn.

## 5. Kết quả mô phỏng: nhanh hơn dù nhiều biến hơn, vững khi bị nhiễu

**Ví dụ.** Một bài kiểm tra 100 câu trắc nghiệm ngắn có thể làm xong nhanh hơn 50 câu tự luận dài.

Nhóm tác giả so sánh các cách viết mô hình với 15 nút, horizon 0.56 s (70% chu kỳ gait); thời gian giải được ghi dưới dạng trung bình (độ lệch chuẩn):

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

Phương pháp đề xuất có **nhiều biến nhất nhưng giải nhanh nhất**, vì ràng buộc RNEA cần ít lệnh nhất và Fatrop hoạt động tốt hơn hẳn khi động lực học được viết dưới dạng path constraint.

![Robot tự hạ/nâng thân để bám quỹ đạo tay khi trot](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig3_arm_tracking.png)

*Phối hợp toàn thân: khi đang trot, MPC tự hạ hoặc nâng thân để tay với tới mục tiêu thấp và cao.*
Nguồn: Hình 3, arXiv 2511.19709

**Ví dụ.** Bị xô ngang vai khi đang đi, ta tự bước sang một bên để đỡ mà tay vẫn giữ chắc cốc cà phê.

Khi chưa tính trễ tính toán và chỉ dùng mô-men feed-forward ($K_p = K_d = 0$), robot trot về phía trước ở **0.2 m/s** trong khi bám quỹ đạo tay, đồng thời tự hạ/nâng thân để với tới mục tiêu. Khi trot tại chỗ, **vận tốc ngang của base bị nhiễu 0.8 m/s** (nhiễu vận tốc, không phải lực đẩy): MPC ổn định lại hệ, tay vẫn bám tốt và mô-men luôn trong giới hạn, có lần khớp bắp chân sau trái chạm đúng giới hạn **320 N·m**. Phản ứng phụ thuộc pha gait; ở lần nhiễu thứ hai, chân sau phải thay đổi vị trí đặt chân đáng kể. Khi tính đến trễ tính toán, cần $K_d \approx 5$; bước thời gian thích nghi (10–100 ms) cho độ trôi base **0.4 cm/s**, so với **1.2 cm/s** khi dùng bước cố định 40 ms trên cùng horizon.

![Chống nhiễu vận tốc ngang 0.8 m/s](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig4_base_disturbance.png)

*Chống nhiễu: vận tốc ngang của base bị nhiễu 0.8 m/s khi trot tại chỗ. Đồ thị cho thấy vận tốc ngang của end-effector và base, cùng mô-men khớp bắp chân hai chân sau (RL và RR).*
Nguồn: Hình 4, arXiv 2511.19709

**Tóm lại:** với 12.5 ms mỗi lần giải, MPC đủ nhanh cho 80 Hz; trong mô phỏng, riêng mô-men MPC tính ra đã đủ để robot vừa đi vừa bám tay và chống nhiễu mà không vượt giới hạn mô-men.

## 6. Phần cứng và bài học sim-to-real

**Ví dụ.** Người bê vật nặng bằng cả cơ thể, dồn trọng tâm và trụ chân, bê được nhiều hơn người chỉ dùng sức cánh tay.

Trên robot thật, cần $K_d \approx 20$ để tránh dao động động cơ tần số cao. Các chân **không cần $K_p$**, cho thấy mô-men do MPC tính ra đã đủ tốt; riêng tay cần thêm một thành phần P nhỏ do cảm biến khớp nhiễu. Robot **kéo được tải 10 kg** khi đứng và khi đi, trong khi tải định danh của tay Z1 chỉ **3–5 kg**. Mô phỏng cho thấy có thể kéo tới **14 kg**, nhưng trên phần cứng, khớp tay thứ 3 bị quá nhiệt. Các demo khác gồm đẩy hộp vào tường khi trot tại chỗ, lau bảng trắng và tương tác mềm với người.

![Kéo tải 10 kg khi đang đi](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig5_walking_pulling.png)

*Kéo tải 10 kg trong khi đang đi (ảnh trái của Hình 5).*
Nguồn: Hình 5, arXiv 2511.19709

![Lau bảng trắng chính xác](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig5_board_wiping.png)

*Lau bảng trắng chính xác (ảnh phải của Hình 5).*
Nguồn: Hình 5, arXiv 2511.19709

**Ví dụ.** Tập đi trên sàn phẳng trong nhà rồi mới ra đường, ta có thể phát hiện đôi giày mới bị lệch đế; nếu không sửa, ta sẽ luôn bị ngả về sau.

Thời gian giải trên phần cứng dao động nhiều hơn, có lúc lên tới **20 ms**, so với trung bình **12.5 ms** trong mô phỏng. Ở khớp bắp chân sau trái (Hình 6), phần cứng xuất hiện **đỉnh vận tốc do chân chạm đất trễ** so với lịch gait. Ngoài ra, URDF đặt CoM của base cách tâm hình học không quá 1 cm, nhưng đo thực tế cho thấy **trọng lượng lệch về phía sau khoảng 60%**. Sau khi hiệu chỉnh offset CoM và mục tiêu lực tiếp xúc, hiện tượng ngả về sau giảm rõ rệt, và mọi kết quả trong bài báo đều dùng phiên bản đã hiệu chỉnh này.

![So sánh mô phỏng và phần cứng ở khớp bắp chân sau trái](/images/MPC-Dong-Luc-Hoc-Nguoc-Toan-Than/fig6_sim_vs_hw.png)

*Mô-men và vận tốc của khớp bắp chân sau trái khi trot: (a) mô phỏng, bên trái; (b) phần cứng, bên phải.*
Nguồn: Hình 6, arXiv 2511.19709

**Tóm lại:** nhờ huy động cả thân, cánh tay 3–5 kg kéo được 10 kg trên robot thật, với giới hạn nằm ở nhiệt độ động cơ tay; đồng thời, sai lệch mô hình khối lượng cho thấy system identification là bước không thể bỏ qua.

## 7. Hạn chế: bộ điều khiển chưa "nhìn thấy" vật thể và còn phụ thuộc mô hình

**Ví dụ.** Một tài xế biết mình đang kéo mạnh cỡ nào nhưng không nhìn thấy thùng hàng phía sau sẽ trượt ra sao.

Lực và vận tốc tay là lệnh từ bên ngoài; vật thể không được mô hình hóa, nên MPC không suy luận được phản ứng của vật. Lực thực tế tác dụng lên vật chưa được đo (do thiếu thiết bị), nên việc bám lực chưa được kiểm chứng. Lịch gait là cố định và chưa có ràng buộc tránh va chạm (cả thân robot lẫn tay). Mô hình bỏ qua ma sát động cơ và quán tính rotor, thời điểm tiếp xúc giữa mô phỏng và thực tế không khớp, và mô hình khối lượng sai lệch đòi hỏi system identification bài bản hơn. Giới hạn mô-men chỉ áp cho $k \le 2$, chỉ 4/6 khớp tay được sử dụng, và MPC chạy off-board trên CPU desktop mạnh. Tải bị giới hạn bởi nhiệt của khớp tay, thời gian giải trên phần cứng biến động, chưa có so sánh với SQP, và kết quả phần cứng chủ yếu mang tính định tính.

**Tóm lại:** bộ điều khiển mạnh về phía robot nhưng chưa mô hình hóa vật thể, chưa đo lực thực, và vẫn cần một máy tính mạnh đặt ngoài robot.

## 8. Điểm rút ra: một tầng thay hai tầng, với công cụ mở

**Ví dụ.** Đây giống một công thức nấu ăn tốt với nguyên liệu mua được ở chợ: không cần dụng cụ đắt tiền, chỉ cần làm đúng trình tự.

1. **Một tầng thay hai tầng:** MPC toàn thân mức mô-men chạy real-time và đưa lời giải thẳng xuống PD, không cần WBC.
2. **Cách viết bài toán quan trọng ngang mô hình:** động lực học ngược dạng path constraint nhanh hơn cả forward dynamics lẫn centroidal, dù có nhiều biến hơn (Table I).
3. **Kỹ thuật dùng được ngay:** bước thời gian thích nghi; Fatrop kết hợp warm-start và sinh mã; chỉ giới hạn mô-men ở các nút đầu.
4. **Rào cản thấp:** chỉ dùng công cụ mở (Pinocchio, CasADi, Fatrop), có code công khai, chạy trên phần cứng Unitree thương mại và một CPU desktop, không cần GPU hay dữ liệu lớn; đây là baseline model-based tốt cho các lab có Go2/B2 + Z1.
5. **Hướng tiếp theo:** kết hợp RL (bền vững với sai số mô hình nhờ domain randomization) với MPC (lập kế hoạch cả lực lẫn chuyển động, có ràng buộc an toàn).

**Tóm lại:** để một MPC duy nhất chọn cùng lúc mô-men, gia tốc và lực, rồi kiểm tra chúng bằng định luật Newton tại từng nút, vừa chính xác hơn vừa nhanh hơn kiến trúc phân tầng.

## Tham khảo

- Lukas Molnar, Jin Cheng, Gabriele Fadini, Dongho Kang, Fatemeh Zargarbashi, Stelian Coros (Computational Robotics Lab, ETH Zurich). *Whole-Body Inverse Dynamics MPC for Legged Loco-Manipulation*. [arXiv 2511.19709](https://arxiv.org/abs/2511.19709), v1, 24/11/2025, CC BY 4.0. Ảnh đầu trang và các hình đánh số lấy từ bài báo.
- Website dự án: <https://lukasmolnar.github.io/wb-mpc-locoman>
- Code: <https://github.com/lukasmolnar/wb-mpc-locoman>
