---
layout: '../../layouts/Post.astro'
title: 'Dex-One2Many: Learning Dexterous Manipulation from a Single Human Demonstration'
description: 'Bài báo arXiv 2610.12470: từ một video người duy nhất, Dex-One2Many trích xuất cấu trúc nhiệm vụ dưới dạng scene graph theo giai đoạn, học chính sách tay khéo léo bằng RL trong mô phỏng và chuyển zero-shot sang tay robot 20 bậc tự do, đạt 75% thành công trung bình trên cấu hình chưa thấy.'
publishedAt: 2026-10-10
image: /images/Dex-One2Many/hero_fig1
alt: 'Hình 1 của bài báo Dex-One2Many: từ một video người đến nhiều hành vi khéo léo trên robot thật và trong mô phỏng'
category: HUST
---

## 1. Học từ một video: vì sao bắt chước chuyển động không tổng quát được

**Ví dụ.** Xem một người đầu bếp thái hành một lần, người học giỏi không ghi nhớ từng tọa độ của con dao, mà hiểu rằng "cầm dao, giữ củ hành, thái thành lát". Nhờ vậy, họ thái được củ hành đặt ở bất kỳ đâu trên thớt.

Học thao tác khéo léo (dexterous manipulation) từ video người rẻ hơn nhiều so với teleoperation, nhất là với bàn tay robot nhiều ngón. Tuy vậy, các phương pháp hiện có chủ yếu **bắt chước chuyển động**: quỹ đạo vật, chuyển động tay được retarget, hoặc tín hiệu tiếp xúc. Chính sách thu được vì thế chỉ hoạt động tốt quanh cấu hình xuất hiện trong video. Bài báo dẫn ví dụ Human2Sim2Robot (vị trí ban đầu trong phạm vi 4 cm × 4 cm, đích cố định) và Video2Sim2Real (vị trí ban đầu và đích trong ±5 cm, ±10°). Ở chiều ngược lại, học tăng cường (RL) thuần túy có khả năng tổng quát tốt nhưng rất khó khám phá trong không gian nhiều bậc tự do và nhiều giai đoạn.

Nhóm tác giả chỉ ra hai thách thức gắn chặt với nhau: **trừu tượng hóa nhiệm vụ** (từ video cần giữ lại gì, bỏ đi gì) và **khám phá khó**. Dex-One2Many giải quyết cả hai bằng cách trích xuất **cấu trúc nhiệm vụ** thay vì chuyển động, rồi dùng cấu trúc đó để dẫn dắt RL trong mô phỏng.

<figure>
<video controls preload="metadata" width="640" src="https://dex-one2many.github.io/static/videos/one2many_human.mp4"></video>
<figcaption>Đầu vào duy nhất của phương pháp: một video người đặt búp bê vào bát. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="640" src="https://dex-one2many.github.io/static/videos/one2many_config_1.mp4"></video>
<figcaption>Robot thật (UR3 + tay Wuji 1) thực hiện cùng nhiệm vụ ở một cấu hình không có trong video người (cấu hình 1). Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="640" src="https://dex-one2many.github.io/static/videos/one2many_config_3.mp4"></video>
<figcaption>Một cấu hình khác không có trong video người (cấu hình 3). Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

![So sánh bắt chước chuyển động và trích xuất cấu trúc nhiệm vụ](/images/Dex-One2Many/minhhoa_motion_vs_structure.png)

*Bên trái: bắt chước chuyển động sao chép quỹ đạo kèm tọa độ nên bị gắn với cấu hình trong video. Bên phải: Dex-One2Many chỉ giữ lại quan hệ giữa tay và vật theo từng giai đoạn, rồi để RL tự học cách thực hiện.*
Minh họa

**Tóm lại:** sao chép chuyển động từ một video chỉ cho ra hành vi quanh đúng cấu hình đó; muốn tổng quát, cần hiểu nhiệm vụ "là gì" chứ không chỉ "trông như thế nào".

## 2. Phương pháp: VLM hiểu "làm gì", RL học "làm thế nào"

![Tổng quan Dex-One2Many](/images/Dex-One2Many/fig2_overview.jpg)

*Tổng quan phương pháp: (1) từ video người, VLM trích xuất chuỗi scene graph theo giai đoạn; (2) mỗi đồ thị giai đoạn ràng buộc việc sinh trạng thái reset đa dạng và reward cho RL, với lớp QP ở mức thấp; (3) chuyển zero-shot sang robot thật.*
Nguồn: Hình 2, arXiv 2610.12470

**Ví dụ.** Một công thức nấu ăn ghi "cho hành vào chảo, rồi đổ trứng lên trên", chứ không ghi hành phải nằm ở tọa độ nào. Công thức mô tả quan hệ và thứ tự, còn người nấu tự xoay xở chi tiết.

**Trừu tượng hóa bằng scene graph theo giai đoạn.** Một mô hình thị giác–ngôn ngữ (VLM) xem video cùng một bộ từ vựng predicate độc lập với nhiệm vụ (ví dụ grasp, contact, inside, seat, và các dạng tiếp cận như pre_grasp, pre_inside). Kết quả là một chuỗi scene graph, trong đó mỗi cạnh là một quan hệ tay–vật hoặc vật–vật. Một giai đoạn mới bắt đầu khi quan hệ thay đổi, chẳng hạn từ pre-grasp sang grasp. Điểm khác biệt quan trọng so với các công trình như ORION là scene graph **không mang theo tọa độ hay quỹ đạo** từ video.

**Ví dụ.** Muốn tập một bài nhảy dài, không ai bắt đầu lần nào cũng từ động tác đầu tiên; người ta tập riêng từng đoạn, bắt đầu ngay tại đoạn khó.

**RL dựa trên scene graph.** Bài toán được mô hình như một MDP hữu hạn. Quan sát gồm đặc trưng của các nút (trạng thái khớp của tay, hình học và pose 6D của vật, vùng chức năng) và của các cạnh (pose tương đối 6D). Scene graph được dùng như một **ràng buộc sinh**: ở mỗi giai đoạn, hệ thống lấy mẫu các trạng thái ban đầu thỏa đồ thị, dùng các grasp đa ngón tổng hợp riêng cho từng bàn tay (Dexonomy, 33 kiểu grasp) kèm lệnh đóng ngón, rồi lọc bằng kiểm tra va chạm và ổn định trong mô phỏng. Các episode bắt đầu đều ở mọi giai đoạn, nhờ đó RL không phải tự khám phá toàn bộ chuỗi thao tác từ đầu.

![Reward suy ra từ predicate của scene graph](/images/Dex-One2Many/fig3_scene_graph_reward.jpg)

*Dùng predicate của scene graph để học chính sách: (a) predicate hình học được ánh xạ thành hàm khoảng cách; (b) cách lắp ráp reward; (c) reward nhiệm vụ được cộng dần theo từng giai đoạn, cho cả thao tác trực tiếp và dùng công cụ.*
Nguồn: Hình 3, arXiv 2610.12470

**Ví dụ.** Chơi trò "nóng–lạnh", người tìm đồ được nhắc liên tục "nóng hơn" hay "lạnh hơn", thay vì chỉ được báo khi đã tìm thấy.

**Reward dày suy ra từ predicate.** Mỗi predicate hình học được chuyển thành một hàm khoảng cách trong không gian Descartes hoặc không gian khớp, ví dụ khoảng cách $d$ giữa vật và hộp đích. Predicate grasp dùng reward force-closure của CHORD cùng chỉ số chất lượng grasp. Với các predicate khoảng cách, reward là reward tiến độ: chỉ được trao khi khoảng cách hiện tại nhỏ hơn khoảng cách tốt nhất đã đạt trong episode, nên đứng yên không được thưởng. Reward nhiệm vụ đầy đủ (Eq. 5, Appendix C) là

$$
r_t = \sum_{i \le g} r_{i,t} + I_{\text{hold},t} \sum_{i > g} r_{i,t} + r_{\text{success},t} + r_{\text{reg},t},
$$

trong đó $g$ là giai đoạn đầu tiên có predicate grasp, $r_{i,t}$ là reward của các predicate thuộc giai đoạn $i$, $r_{\text{success},t}$ là phần thưởng khi hoàn thành, và $r_{\text{reg},t}$ phạt action và vận tốc khớp lớn. Chỉ báo $I_{\text{hold},t}$ chỉ bằng 1 khi có ít nhất hai ngón tiếp xúc, grasp có chất lượng dương và vật được nâng cao hơn $h_{\text{lift}} = 5$ cm (Eq. 3); nhờ đó, reward của các giai đoạn sau grasp chỉ được bật khi vật thực sự đang được giữ chắc. Reward này **không tham chiếu quỹ đạo của video**.

**Chuyển sang robot thật.** Chính sách được huấn luyện bằng PPO với kiến trúc asymmetric actor–critic, domain randomization, và nhiễu trên pose, kích thước và độ trễ quan sát. Chính sách xuất vận tốc lòng bàn tay và đầu ngón; một bộ điều khiển QP ánh xạ các vận tốc này sang vận tốc khớp và cho phép thêm ràng buộc an toàn khi triển khai (ví dụ khoảng cách tay–bàn) mà không cần huấn luyện lại. Pose của vật được ước lượng bằng FoundationPose++ từ hai camera RealSense D435i.

<figure>
<video controls preload="none" width="640" poster="https://dex-one2many.github.io/static/images/method_poster.jpg" src="https://dex-one2many.github.io/static/videos/method_video.mp4"></video>
<figcaption>Video giải thích phương pháp có thuyết minh của nhóm tác giả. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

**Tóm lại:** VLM biến video thành chuỗi quan hệ theo giai đoạn; chuỗi này vừa sinh ra các điểm bắt đầu đa dạng, vừa cung cấp reward dày, để RL tự học cách thực hiện trên từng bàn tay cụ thể.

## 3. Kết quả: tổng quát vượt ra ngoài video

**Ví dụ.** Một học sinh chỉ học thuộc lời giải mẫu sẽ làm đúng bài trong sách, nhưng lúng túng khi đề thay số; học sinh hiểu phương pháp thì làm được cả hai.

Hệ thống thật gồm cánh tay UR3 và bàn tay **Wuji 1 20 bậc tự do**. Hai baseline là Do as I Do và CHORD. Năm nhiệm vụ gồm ba thao tác trực tiếp (Doll, Can, Stamp) và hai thao tác dùng công cụ (Hammer, Sweep). Với mỗi phương pháp và nhiệm vụ, nhóm tác giả đánh giá 30 episode trong mô phỏng và 30 lượt trên robot thật (10 ở cấu hình Seen, 20 ở cấu hình Unseen). Cấu hình Seen tái tạo vị trí ban đầu và đích trong video; cấu hình Unseen dùng vị trí khác. Chính sách được triển khai zero-shot, không dùng dữ liệu thật hay fine-tuning.

![Tỉ lệ thành công Seen/Unseen trong mô phỏng và thực tế](/images/Dex-One2Many/fig4_success_rates.png)

*Tỉ lệ thành công trên cấu hình Seen (trên) và Unseen (dưới), trong mô phỏng (trái) và thực tế (phải).*
Nguồn: Hình 4, arXiv 2610.12470

Các số liệu của Hình 4 (thứ tự Do as I Do / CHORD / Dex-One2Many, đơn vị %):

| | Doll | Can | Stamp | Hammer | Sweep |
|---|---|---|---|---|---|
| Mô phỏng, Seen | 0 / 0 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 0 / 90 | 100 / 100 / 100 |
| Mô phỏng, Unseen | 0 / 0 / 95 | 0 / 0 / 90 | 15 / 0 / 100 | 0 / 0 / 95 | 0 / 5 / 85 |
| Thực tế, Seen | 0 / 60 / 100 | 20 / 90 / 90 | 20 / 90 / 80 | 40 / N/A / 70 | 100 / 70 / 80 |
| Thực tế, Unseen | 0 / 0 / 80 | 0 / 15 / 75 | 10 / 0 / 85 | 5 / N/A / 60 | 5 / 0 / 75 |

N/A: thí nghiệm không thực hiện được do hỏng phần cứng.
Nguồn: Hình 4, arXiv 2610.12470

Trên cấu hình Seen, baseline đạt tỉ lệ cao ở nhiều nhiệm vụ, cho thấy hướng dẫn ở mức chuyển động có thể tái tạo đúng cấu hình trong video. Khác biệt xuất hiện rõ ở cấu hình Unseen: baseline đạt **không quá 15%** cả trong mô phỏng lẫn thực tế, trong khi Dex-One2Many đạt **85–100%** trong mô phỏng và **60–85%** trên robot thật. Trung bình trên robot thật ở cấu hình Unseen, Dex-One2Many đạt **75%**, hơn baseline tốt nhì **71 điểm phần trăm**. Theo tóm tắt của bài báo, phương pháp vượt baseline **6.5%** ở cấu hình Seen và **71%** ở cấu hình Unseen.

![Tổng quát theo vị trí ban đầu trên nhiệm vụ Can](/images/Dex-One2Many/fig5_can_initial_positions.jpg)

*Nhiệm vụ Can trong mô phỏng, với đích cố định: baseline chủ yếu thành công gần vị trí trong video, còn Dex-One2Many thành công trên một vùng rộng hơn nhiều của không gian làm việc.*
Nguồn: Hình 5, arXiv 2610.12470

<figure>
<video controls preload="metadata" width="640" src="https://dex-one2many.github.io/static/videos/real/can_1.mp4"></video>
<figcaption>Robot thật, nhiệm vụ Can. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="640" src="https://dex-one2many.github.io/static/videos/real/stamp_1.mp4"></video>
<figcaption>Robot thật, nhiệm vụ Stamp. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

**Tóm lại:** ở cấu hình có trong video, baseline và Dex-One2Many đều có thể làm tốt; ở cấu hình mới, baseline gần như thất bại, còn Dex-One2Many vẫn đạt 60–85% trên robot thật.

## 4. Một đặc tả nhiệm vụ cho nhiều bàn tay khác nhau

**Ví dụ.** Cùng một công thức bánh có thể làm bằng lò điện hay lò ga; người làm chỉ cần chỉnh nhiệt độ và thời gian cho từng loại lò.

Vì scene graph không phụ thuộc vào bàn tay, cùng một đặc tả nhiệm vụ có thể dùng cho nhiều embodiment, chỉ cần thay URDF và tập grasp. Trong mô phỏng (500 episode mỗi nhiệm vụ), bốn tổ hợp đều đạt tỉ lệ thành công trung bình từ 94.6% đến 96.8%:

| | UR3 + Wuji 1 | UR5e + Sharpa | UR5e + Wuji 2 | UR5e + Allegro |
|---|---|---|---|---|
| Doll | 88.4 | 98.4 | 97.2 | 97.2 |
| Can | 93.6 | 97.4 | 95.2 | 92.2 |
| Stamp | 98.6 | 96.6 | 97.0 | 98.8 |
| Hammer | 94.6 | 94.2 | 97.6 | 91.8 |
| Sweep | 98.0 | 96.6 | 97.0 | 100.0 |
| **Trung bình** | **94.6** | **96.6** | **96.8** | **96.0** |

Nguồn: Table 1, arXiv 2610.12470

<figure>
<video controls preload="metadata" width="480" src="https://dex-one2many.github.io/static/videos/sim/sweep_human.mp4"></video>
<figcaption>Video người cho nhiệm vụ Sweep, đầu vào duy nhất cho cả bốn bàn tay bên dưới. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="480" src="https://dex-one2many.github.io/static/videos/sim/sweep_ur3_wuji1_1.mp4"></video>
<figcaption>Mô phỏng, Sweep, UR3 + Wuji 1, một cấu hình unseen. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="480" src="https://dex-one2many.github.io/static/videos/sim/sweep_ur5e_sharpa_1.mp4"></video>
<figcaption>Mô phỏng, Sweep, UR5e + Sharpa. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="480" src="https://dex-one2many.github.io/static/videos/sim/sweep_ur5e_wuji2_1.mp4"></video>
<figcaption>Mô phỏng, Sweep, UR5e + Wuji 2. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

<figure>
<video controls preload="metadata" width="480" src="https://dex-one2many.github.io/static/videos/sim/sweep_ur5e_allegro_1.mp4"></video>
<figcaption>Mô phỏng, Sweep, UR5e + Allegro. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

![Chiến lược grasp đa dạng theo bàn tay và cấu hình](/images/Dex-One2Many/fig6_diverse_grasp.jpg)

*Nhiệm vụ Doll: theo taxonomy 33 kiểu grasp (Feix et al.), mỗi bàn tay chọn kiểu grasp khác nhau, và cùng một bàn tay đổi grasp khi cấu hình vật thay đổi.*
Nguồn: Hình 6, arXiv 2610.12470

Thay vì retarget một grasp cố định của người, phương pháp cho RL tiếp xúc với các grasp tổng hợp riêng cho từng hình thái bàn tay, và chính sách tự học grasp nào phù hợp với từng tình huống.

**Tóm lại:** đặc tả nhiệm vụ tách khỏi phần cứng; đổi bàn tay chỉ cần đổi mô hình và tập grasp, và mỗi bàn tay tự tìm cách cầm phù hợp với nó.

## 5. Thành phần nào quyết định: phân tích ablation

**Ví dụ.** Một chiếc ghế ba chân đổ ngay khi mất một chân; thử bỏ từng chân giúp biết chân nào gánh nhiều nhất.

Mọi ablation được thực hiện trên nhiệm vụ Sweep trong mô phỏng (Hình 7 của bài báo). Bỏ **reset theo giai đoạn** làm tỉ lệ thành công sau 2k lần cập nhật PPO giảm từ trên 90% xuống khoảng 16%, cho thấy bắt đầu từ các giai đoạn trung gian là chìa khóa để khám phá nhiệm vụ nhiều giai đoạn. Bỏ **reward dày suy từ predicate** khiến tỉ lệ thành công giữ ở 0% trong suốt quá trình huấn luyện. Bỏ **lệnh đóng ngón đã kiểm chứng** làm tỉ lệ giảm xuống khoảng 48% và gây trượt, rơi vật thường xuyên.

Quy mô huấn luyện cũng quan trọng: với 49,152 môi trường song song, phương pháp đạt trên 90%, trong khi với 24,576 hoặc 12,288 môi trường, tỉ lệ vẫn dưới 25% sau cùng số lần cập nhật PPO.

**Tóm lại:** reset theo giai đoạn và reward dày là hai trụ cột không thể thiếu, lệnh đóng ngón giữ grasp ổn định, và quy mô mô phỏng song song lớn là điều kiện để học được.

## 6. Hạn chế và ý nghĩa thực tiễn

**Ví dụ.** Một tài xế lái giỏi trong mô phỏng vẫn cần quen với gương chiếu hậu hơi mờ của chiếc xe thật.

Nhóm tác giả nêu hai hạn chế. Thứ nhất, vẫn còn khoảng cách sim-to-real do phụ thuộc vào pose 6D ước lượng; nhiễu pose và sai khác hình học của vật ảnh hưởng nhiều nhất ở các pha giàu tiếp xúc. Thứ hai, pipeline real-to-sim chỉ dựng được vật cứng; vật có khớp cần dựng asset thủ công. Ngoài ra, thực nghiệm gồm 5 nhiệm vụ trên mặt bàn với 20 lượt Unseen mỗi nhiệm vụ trên robot thật, chỉ một embodiment được thử trên phần cứng, phương pháp cần rất nhiều môi trường song song trên GPU, và phụ thuộc vào VLM cùng bộ predicate định sẵn. Mã nguồn của bài báo hiện chưa được công bố.

Với các nhóm robotics và humanoid tại Việt Nam, hướng tiếp cận này có ba điểm đáng chú ý. Một video quay bằng điện thoại cùng mô phỏng có thể đủ để khởi động một chính sách tay khéo léo, giảm chi phí dữ liệu so với teleoperation. Thiết kế "VLM hiểu làm gì, RL học làm thế nào" cho phép dùng lại cùng một đặc tả nhiệm vụ khi phần cứng thay đổi. Các kỹ thuật như reset theo giai đoạn, reward suy từ predicate và lớp QP để thêm ràng buộc an toàn khi triển khai có thể áp dụng ngay vào các pipeline RL hiện có.

<figure>
<video controls preload="none" width="640" src="https://dex-one2many.github.io/static/videos/overview.mp4"></video>
<figcaption>Video tổng quan có thuyết minh của nhóm tác giả. Nguồn: trang dự án Dex-One2Many.</figcaption>
</figure>

**Tóm lại:** phương pháp còn phụ thuộc vào ước lượng pose, chỉ xử lý vật cứng và cần tài nguyên mô phỏng lớn, nhưng mở ra một cách rẻ để dạy tay robot từ một video duy nhất.

## Tham khảo

- Jusuk Lee, Sungha Kim, Yeonsoo Park, Jonguk Cheon, Yoonkyo Jung, Yongjun You, H. Jin Kim, Jia-Bin Huang, Furong Huang, Youngseok Jang, Seungjae Lee (Seoul National University, University of Maryland College Park, KAIST). *Dex-One2Many: Learning Dexterous Manipulation from a Single Human Demonstration*. [arXiv 2610.12470](https://arxiv.org/abs/2610.12470), v1, CC BY 4.0. Ảnh đầu trang và các hình đánh số lấy từ bài báo.
- Trang dự án (nguồn các video; website ghi giấy phép CC BY-SA 4.0): <https://dex-one2many.github.io/>
- Mã nguồn: chưa được công bố.
