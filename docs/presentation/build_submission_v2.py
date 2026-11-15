"""Rebuild the ten-slide English PDF and Russian speaking notes. No product changes."""
from pathlib import Path
import json, re
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[2] / 'outputs' / 'submission'
OUT.mkdir(parents=True, exist_ok=True)
ASSETS = ROOT / 'assets'
for name, file in [('Sans', 'segoeui.ttf'), ('Bold', 'segoeuib.ttf'), ('Title', 'georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / file)))
BG = '#F5F5EE'; INK = '#193B33'; GREEN = '#246B58'; MUTED = '#576F65'
LINE = '#CCD6C8'; LIME = '#DDEAA7'; WHITE = '#FFFFFF'; RED = '#9B493D'
W, H = 960, 540
DEST = OUT / 'CoParent_Ledger_Jury_Deck_v2.pdf'
P = canvas.Canvas(str(DEST), pagesize=(W, H))
P.setTitle('CoParent Ledger | Product, value and retention | 15 November 2026')
P.setAuthor('CoParent Ledger')
BOUNDS = []
URL = 'https://coparent-ledger-demo.pages.dev/'

def box(x, y, w, h, color, radius=0):
    P.setFillColor(HexColor(color))
    if radius: P.roundRect(x, H-y-h, w, h, radius, fill=1, stroke=0)
    else: P.rect(x, H-y-h, w, h, fill=1, stroke=0)

def text(t, x, y, size=18, color=INK, font='Sans'):
    P.setFillColor(HexColor(color)); P.setFont(font, size)
    P.drawString(x, H-y-size, t)
    BOUNDS.append((P.getPageNumber(), t, x, y, x+pdfmetrics.stringWidth(t, font, size), y+size))

def para(t, x, y, w, size=18, color=INK, font='Sans', leading=None, maxh=None):
    st = ParagraphStyle('p', fontName=font, fontSize=size, leading=leading or size*1.3, textColor=HexColor(color))
    p = Paragraph(t, st); pw, ph = p.wrap(w, H)
    if maxh is not None: assert ph <= maxh, (P.getPageNumber(), t, ph, maxh)
    p.drawOn(P, x, H-y-ph)
    BOUNDS.append((P.getPageNumber(), t, x, y, x+pw, y+ph))
    return ph

def link(label, url, x, y, size=9, color=MUTED):
    text(label, x, y, size, color)
    w = pdfmetrics.stringWidth(label, 'Sans', size)
    P.linkURL(url, (x, H-y-size-3, x+w, H-y+2), relative=0, thickness=0)

def line(x, y, w):
    P.setStrokeColor(HexColor(LINE)); P.setLineWidth(.7); P.line(x, H-y, x+w, H-y)

def page(n, title=None, sub=None, dark=False):
    box(0, 0, W, H, INK if dark else BG)
    text('CoParent Ledger', 48, 24, 11, LIME if dark else GREEN, 'Bold')
    text(f'{n:02d} / 10', 865, 24, 10, LIME if dark else MUTED)
    if title: para(title, 48, 66, 864, 31, WHITE if dark else INK, 'Title', maxh=44)
    if sub: para(sub, 48, 119, 864, 14, LIME if dark else MUTED, maxh=40)

def footer(t): para(t, 48, 500, 864, 8.5, MUTED, leading=11, maxh=27)
def end(): P.showPage()

def img(name, x, y, w, h):
    im = Image.open(ASSETS/name); iw, ih = im.size
    scale = min(w/iw, h/ih); dw, dh = iw*scale, ih*scale
    P.drawImage(ImageReader(im), x+(w-dw)/2, H-y-dh, width=dw, height=dh, mask='auto')

def table(headers, rows, x, y, widths, rowh=46, size=16):
    box(x, y, sum(widths), 36, INK); xx = x
    for heading, w in zip(headers, widths):
        text(heading, xx+12, y+8, 11, WHITE, 'Bold'); xx += w
    yy = y+36
    for i, row in enumerate(rows):
        if i % 2 == 0: box(x, yy, sum(widths), rowh, '#E9EEE2')
        xx = x
        for j, (value, w) in enumerate(zip(row, widths)):
            para(value, xx+12, yy+9, w-24, size, INK, 'Bold' if j == 0 else 'Sans', maxh=rowh-12)
            xx += w
        yy += rowh

# 1: Product and promise.
page(1, dark=True)
text('CoParent', 48, 88, 62, WHITE, 'Title'); text('Ledger', 48, 163, 62, WHITE, 'Title')
para('Know what was agreed.<br/>Know what is still owed.', 52, 265, 500, 28, WHITE, leading=39)
para('A browser ledger for parents<br/>sharing the cost of raising children.', 52, 363, 500, 19, LIME, leading=27)
box(604, 99, 308, 321, '#275347', 4)
text('ONE EXPENSE, ONE CLEAR RECORD', 623, 119, 10, LIME, 'Bold')
for yy, label, amount in [(159, 'Purchase', '$64.20'), (242, 'Agreed share', '$32.10'), (325, 'Still owed after confirmation', '$20.00')]:
    text(label, 623, yy, 12, WHITE); text(amount, 623, yy+23, 35, LIME, 'Title')
text('Synthetic example from the public-site QA', 604, 433, 10, LIME)
link('coparent-ledger-demo.pages.dev', URL, 52, 473, 15, LIME)
text('Business Cup 2.0  /  Money  /  15 November 2026', 52, 508, 10, LIME)
end()

# 2: Concrete user and problem, no invented customer quote.
page(2, 'The receipt is easy. Agreement is the hard part.', 'School, medical care and activities create recurring decisions for parents living apart.')
for yy, number, heading, body in [
    (180, '01', 'Evidence gets separated', 'A receipt in one message; the agreed split in another.'),
    (274, '02', 'A request is not an agreement', 'The amount may still be awaiting approval or disputed.'),
    (368, '03', 'Sent is not received', 'A partial reimbursement can leave an unclear balance.')]:
    text(number, 48, yy, 27, GREEN, 'Title'); text(heading, 105, yy, 20, INK, 'Bold')
    para(body, 105, yy+34, 480, 16, MUTED, maxh=50)
box(654, 177, 258, 278, '#E6EBD8')
text('WHO WE START WITH', 676, 198, 11, GREEN, 'Bold')
para('US co-parents, mainly ages 25-45, with recurring shared costs and a willingness to coordinate.', 676, 234, 210, 20, maxh=160)
para('One purchasing family unit.<br/>Both parents included.', 676, 393, 210, 13, MUTED)
footer('Problem and target-segment hypotheses. Not a measured claim about conflict reduction, time saved or willingness to pay.')
end()

# 3: End-to-end, distinguishing a pending report from receipt.
page(3, 'From a receipt to a confirmed balance', 'Public-site QA used a new expense, user-entered amounts and a synthetic sample receipt.')
steps = [
    ('01', 'Record', '$64.20', 'Attach a receipt and propose a 50% share.'),
    ('02', 'Agree', '$32.10', 'The second role approves. An objection stays outside agreed totals.'),
    ('03', 'Report', '$12.10', 'Record a partial reimbursement. Still owed: $32.10.'),
    ('04', 'Confirm', '$20.00', 'Only recipient confirmation reduces the remaining balance.')]
for i, (number, heading, amount, body) in enumerate(steps):
    x = 48 + i*222
    text(number, x, 181, 16, GREEN, 'Bold'); text(heading, x, 211, 23, INK, 'Bold')
    text(amount, x, 257, 34, GREEN, 'Title'); para(body, x, 314, 195, 16, MUTED, maxh=105)
line(48, 427, 864)
para('Every action stays in the history. Future plans never become debt automatically.', 48, 447, 864, 18, INK, 'Bold', maxh=30)
footer('QA_REPORT.md, 15 Nov 2026: public browser flow passed. Two demo roles in one browser; no real transfer or verified two-account service.')
end()

# 4: Value, exact household offer and working gate.
page(4, 'What does a parent pay for?', 'The proposed subscription keeps a recurring expense workflow in one place.')
text('$7.99', 48, 170, 61, GREEN, 'Title'); text('/ month per household', 253, 210, 17, MUTED)
text('Both parents. One subscription.', 48, 253, 24, INK, 'Bold')
for yy, heading, body in [
    (309, 'Clarity', 'Receipts, agreed shares and an explainable balance.'),
    (369, 'Continuity', 'New expenses alongside the existing family history.')]:
    text(heading, 48, yy, 18, GREEN, 'Bold'); para(body, 48, yy+27, 445, 16, MUTED, maxh=45)
para('14-day trial, no card. Expiry blocks new expense drafts; existing records, CSV export and confirmations remain available.', 48, 439, 445, 13, INK, maxh=53)
img('paywall.png', 533, 168, 379, 333)
footer('Current demo: simulate expiry, then enable test access in one click. No charge or paid subscription. UI: local render of the deployed artifact.')
end()

# 5: Product-driven retention, with present capabilities distinguished from hypotheses.
page(5, 'Why renew? The next expense is already coming.', 'Retention hypothesis: repeated reconciliation and useful history, not daily screen time.')
retention = [
    ('New cost', 'School, health and activities create the next entry.'),
    ('Open balance', 'Unresolved shares and partial reimbursements need follow-up.'),
    ('Shared history', 'Review what was agreed and how the balance changed.'),
    ('Next decision', 'Per-child statistics and future estimates support the next discussion.')]
for i, (heading, body) in enumerate(retention):
    x = 48+i*222
    text(f'0{i+1}', x, 185, 17, GREEN, 'Bold'); para(heading, x, 223, 196, 21, INK, 'Bold', maxh=55)
    para(body, x, 290, 195, 17, MUTED, maxh=115)
line(48, 415, 864)
para('Already in demo: saved browser progress.<br/>Return on the same browser and device to continue.', 48, 438, 414, 15, INK, maxh=47)
para('Proof to earn: a second completed expense cycle,<br/>then month 1, 3 and 6 paid renewals.', 492, 438, 420, 15, INK, maxh=47)
footer('Actual renewal is unmeasured. Local storage is not cloud sync or a secure backup; clearing site data can remove progress. No reminder feature is claimed.')
end()

# 6: Real interface and implementation evidence, not invented product screenshots.
page(6, 'The balance tells a checkable story', 'Real interface excerpts with built-in synthetic data; a separate example from slide 3.')
img('reimbursement.png', 48, 167, 365, 309)
img('receipt.png', 433, 167, 256, 284)
text('AGREED SHARE', 727, 180, 11, GREEN, 'Bold'); text('$48.00', 727, 208, 34, GREEN, 'Title')
text('CONFIRMED RECEIVED', 727, 271, 10, GREEN, 'Bold'); text('$20.00', 727, 297, 34, GREEN, 'Title')
text('STILL REMAINING', 727, 360, 11, GREEN, 'Bold'); text('$28.00', 727, 386, 34, GREEN, 'Title')
para('Also in the guest demo: child/parent names, custom categories, per-child statistics and future plans.', 48, 467, 864, 13, INK, maxh=23)
footer('Local captures of unchanged deployment 6d00a0a4 (hash matched). Prior public QA: 15 Nov; 62 tests passed and viewport smoke checks passed. No fresh live capture or physical-phone test.')
end()

# 7: Credible alternatives, without unearned novelty claims.
page(7, 'A focused ledger in an established category', 'Positioning hypothesis: an expense-first workflow at one clear price for both parents.')
table(['ALTERNATIVE', 'DISPLAYED US PRICE', 'RELEVANT OFFER'], [
    ['OurFamilyWizard', '$110 / year per parent', 'Broader suite with an expense log'],
    ['AppClose', '$7.99 / month per account', 'Expenses and reimbursement requests'],
    ['2houses', '$169.99 / year per family', 'Family suite, finances and reports'],
    ['Spreadsheet + messages', '$0 incremental cost assumed', 'Flexible, manually maintained records']],
    48, 174, [239, 269, 356], rowh=47, size=15)
para('Our proposed value: the receipt, agreement and confirmed balance stay in one expense history.', 48, 409, 864, 21, INK, 'Bold', maxh=56)
text('Expense tracking and family pricing already exist. Preference for our focus must be earned.', 48, 465, 12, MUTED)
link('OurFamilyWizard pricing', 'https://www.ourfamilywizard.com/plans-and-pricing', 48, 501, 9)
link('AppClose account pricing', 'https://support.appclose.com/hc/en-us/articles/45803225192091-AppClose-Subscription-Fee-Waiver-Frequently-Asked-Questions', 263, 501, 9)
link('2houses family pricing', 'https://www.2houses.com/en/pricing', 490, 501, 9)
text('Checked 15 Nov 2026; advertised, not tested.', 676, 501, 8.5, MUTED)
end()

# 8: Units and conditional market, no parent-to-customer equivalence.
page(8, 'A large problem; a narrower initial market', 'Illustrative US scenarios at $95.88 per paid household-year. These are not measured demand.')
table(['MODEL / UNIT', 'CONSERVATIVE', 'BASE'], [
    ['TAM: recurring-need pairs', '2.61m / $250m per year', '5.56m / $533m per year'],
    ['SAM: initial commercial fit', '261k / $25m per year', '1.001m / $96m per year'],
    ['SOM: active payers, month 12', '47 / $4.46k ARR', '196 / $18.80k ARR']],
    48, 169, [322, 275, 267], rowh=49, size=15)
text('Anchor: 13.9m custodial parents. A parent count is not a customer count.', 48, 376, 17, INK, 'Bold')
para('TAM = 13.9m x pair mapping x recurring need. SAM adds audience fit, participation and price willingness.<br/>Conservative / base filters: 0.75 / 1 x 25% / 40%; then 50% / 60% x 40% / 50% x 50% / 60%.', 48, 414, 864, 12, MUTED, maxh=38)
text('SOM assumes 10 / 30 new payers per month, with 20% / 12% monthly churn over 12 months.', 48, 465, 12, MUTED)
link('US Census: reference 2022; published Aug 2025.', 'https://www2.census.gov/library/publications/2025/demo/p60-285.pdf', 48, 503, 9)
text('Model and assumptions: MARKET_AND_ECONOMICS.md, 15 Nov 2026.', 481, 503, 9, MUTED)
end()

# 9: Transparent price-to-LTV logic, channels and downside.
page(9, 'Low acquisition cost and renewals decide viability', 'Scenario assumptions per paying household. No project CAC, revenue or retention has been measured.')
table(['METRIC', 'CONSERVATIVE', 'BASE'], [
    ['CAC: referrals / content', '$45 / $60', '$20 / $30'],
    ['Blended CAC: equal payer mix', '$52.50', '$25.00'],
    ['Monthly churn assumption', '20%', '12%'],
    ['Contribution after variable costs', '$5.14 / month', '$6.34 / month'],
    ['Contribution LTV; LTV / CAC', '$25.70; 0.49x', '$52.84; 2.11x']],
    48, 169, [470, 197, 197], rowh=40, size=14)
text('LTV = monthly contribution / churn. CAC = channel cost / new paying households.', 48, 422, 13, INK, 'Bold')
para('The conservative case fails. Broad paid-search CAC of $281-$562 also fails.<br/>Base retention is ambitious: 21.6% survive 12 renewals; a weaker first renewal lowers LTV to $36.46.', 48, 452, 864, 13, RED, maxh=39)
link('Benchmarks: RevenueCat 2026 (2025 data)', 'https://www.revenuecat.com/state-of-subscription-apps', 48, 506, 8.5)
link('WordStream 2026 (Apr 2025-Mar 2026)', 'https://www.wordstream.com/blog/2026-google-ads-benchmarks', 447, 506, 8.5)
text('Fixed costs excluded.', 793, 506, 8.5, MUTED)
end()

# 10: Clear demo action, honest limits and scale requirement.
page(10, dark=True)
para('Try the whole expense cycle.', 48, 76, 700, 39, WHITE, 'Title', maxh=60)
para('No registration. Your own test amounts.<br/>A receipt, an agreement and an explainable balance.', 48, 159, 650, 21, WHITE, leading=30, maxh=70)
link('coparent-ledger-demo.pages.dev', URL, 48, 249, 21, LIME)
qr = QrCodeWidget(URL); bounds = qr.getBounds(); qr_size = 142
draw = Drawing(qr_size, qr_size, transform=[qr_size/(bounds[2]-bounds[0]),0,0,qr_size/(bounds[3]-bounds[1]),0,0]); draw.add(qr)
box(758, 152, qr_size, qr_size, WHITE); renderPDF.draw(draw, P, 758, H-152-qr_size)
text('AVAILABLE NOW', 48, 331, 11, LIME, 'Bold')
para('Guest expense cycle<br/>Test paywall<br/>Saved browser progress', 48, 364, 255, 18, WHITE, leading=28)
text('NEXT PRODUCT PROOF', 358, 331, 11, LIME, 'Bold')
para('Verified shared accounts<br/>Repeat completed cycles<br/>Paid renewal evidence', 358, 364, 300, 18, WHITE, leading=28)
text('LONG-TERM SCALE', 716, 331, 11, LIME, 'Bold')
para('$100m ARR needs<br/>1.043m paid households.<br/>Above our initial SAM.', 716, 364, 204, 16, WHITE, leading=26)
para('Today: two demo roles in one browser; no real payment or cross-device sync. Pricing and retention remain hypotheses.<br/>Public-source submission access is still unresolved; the working repository remains private.', 48, 486, 864, 10, LIME, leading=14, maxh=33)
end()
P.save()
for n, t, x, y, x2, y2 in BOUNDS:
    assert 0 <= x and 0 <= y and x2 <= W+.1 and y2 <= H+.1, (n, t, x2, y2)

speech = [
('1. Продукт', '0:00-0:25', 'CoParent Ledger помогает родителям, которые живут отдельно, вести расходы на детей: от чека и согласованной доли до подтверждённого возмещения. Главный вопрос продукта простой: что мы согласовали и сколько ещё осталось вернуть? Это веб-сервис, его демонстрацию можно открыть без регистрации и пройти со своими тестовыми суммами. Сейчас оба родителя представлены ролями в одном браузере.'),
('2. Боль и аудитория', '0:25-0:55', 'Один родитель оплачивает школу, лечение или кружок. Но чек, обсуждение доли и сообщение о переводе могут оказаться в разных местах. Получается три разных вопроса: есть ли подтверждение расхода, согласился ли второй родитель и действительно ли деньги получены? Мы начинаем с родителей в США, преимущественно от двадцати пяти до сорока пяти лет, которые регулярно делят расходы и готовы координировать их. Это наша гипотеза целевой аудитории.'),
('3. Основной сценарий', '0:55-1:35', 'В проверке опубликованного сайта мы создали расход на шестьдесят четыре доллара двадцать центов и приложили тестовый чек. Второй родитель согласовал половину: тридцать два доллара десять центов. Затем записали частичное возмещение на двенадцать долларов десять центов. Остаток пока не изменился. Только после подтверждения получателем он стал равен двадцати долларам. Это ключевое правило: сообщение о переводе ещё не означает получение. Все действия сохраняются в истории; спорный расход не входит в согласованные суммы.'),
('4. За что предлагаем платить', '1:35-2:05', 'Мы предлагаем подписку семь долларов девяносто девять центов в месяц на одну семью: оба родителя включены. Ценность подписки в непрерывном процессе: добавить новый расход, сохранить доказательство, зафиксировать решение и понимать текущий остаток. Есть четырнадцатидневный пробный период без карты. В demo можно ускорить его окончание: создание новых расходов блокируется, а одна кнопка открывает тестовый доступ. Старые записи и подтверждения остаются доступны. Настоящей оплаты здесь нет.'),
('5. Почему будут возвращаться', '2:05-2:40', 'Удержание связано со следующим расходом, а не с ежедневным открытием приложения. Приходит новый школьный платёж, остаётся часть возмещения, нужно посмотреть историю или расходы по ребёнку. Каждый такой повод возвращает семью к тому же процессу. В demo прогресс уже сохраняется на этом браузере и устройстве. Для бизнеса мы хотим измерять второй завершённый цикл расходов и затем продления на первом, третьем и шестом месяце. Фактических данных о продлениях пока нет.'),
('6. Что уже работает', '2:40-3:05', 'На экране реальный интерфейс с синтетическим примером: согласовано сорок восемь долларов, получено двадцать, осталось двадцать восемь. Ещё десять только ожидают подтверждения и пока входят в остаток. Кроме этого работают имена родителей и детей, категории, статистика по ребёнку и будущие планы. Планы сами по себе долгом не становятся. Снимки получены из неизменённой опубликованной сборки локально; результат публичного сценария зафиксирован в QA.'),
('7. Альтернативы и отличие', '3:05-3:30', 'В этой категории уже есть OurFamilyWizard, AppClose и 2houses, а бесплатная таблица тоже конкурент. Мы не утверждаем, что изобрели учёт семейных расходов. Наше позиционирование: сфокусированный процесс, где чек, согласование и подтверждённый остаток связаны в истории одного расхода, и понятная цена за обоих родителей. Выбор пользователей в пользу такого фокуса ещё нужно доказать.'),
('8. Рынок', '3:30-4:00', 'Census насчитал тринадцать целых девять десятых миллиона родителей соответствующей категории в данных за 2022 год. Это не количество платящих семей. Мы применяем явные предположения о регулярности расходов, соответствии аудитории, участии второго родителя и готовности платить. Получается сценарный TAM от двухсот пятидесяти до пятисот тридцати трёх миллионов долларов в год. Начальный SAM: от двадцати пяти до девяноста шести миллионов. Все эти значения являются моделью, а не измеренным спросом.'),
('9. Экономика', '4:00-4:35', 'Базовый сценарий предполагает двадцать пять долларов на привлечение платящей семьи через рекомендации и контент и двенадцать процентов месячного оттока. После переменных затрат остаётся шесть долларов тридцать четыре цента в месяц. Это даёт около пятидесяти трёх долларов LTV и отношение LTV к CAC около двух. Консервативный сценарий не окупается, как и широкая платная поисковая реклама. Поэтому ключевой бизнес-вопрос: сможем ли мы дёшево привлекать семьи и удерживать их повторной ценностью?'),
('10. Завершение', '4:35-5:00', 'Полный гостевой сценарий доступен по ссылке и QR-коду. Уже можно добавить свой тестовый расход, согласовать его, подтвердить частичное возмещение и увидеть остаток. Следующие доказательства: совместная работа настоящих аккаунтов, повторные циклы и затем реальные продления в отдельно разрешённом коммерческом запуске. Для ста миллионов долларов ARR при этой цене нужно больше миллиона платящих семей; начальная ниша ещё не доказывает такой масштаб.')]
notes = ['# CoParent Ledger: сценарий выступления на 5 минут', '', 'Версия 2, 15 ноября 2026. Слайды на английском. Русский текст предназначен для устного выступления; тайминг ориентировочный, без измеренной репетиции.', '']
for heading, timing, body in speech: notes.extend([f'## {heading} ({timing})', '', body, ''])
notes.extend(['## Заметки для подготовки', '', '- В слайдах нет заявлений о платящих клиентах или доказанном удержании. Числа экономики обозначены как гипотезы.', '- Проверка сайта и 62 теста относятся к записи QA от 15 ноября; в этой правке продукта новые тесты не запускались.', '- Скриншоты: локальный рендер неизменённого артефакта 6d00a0a4. SHA-256: 31776CBBF6329B4E3B9BFFEFB04AEDB16CA59AE5BF9418B94DD8C7B33756CE0D. Новая проверка публичного адреса не выполнена.', '- Исходный англоязычный PDF сохранён отдельно. Для сдачи использовать английский v2; русский устный питч допустим по сохранённому разбору FAQ.', '- Организаторы требуют публичный репозиторий. Рабочий репозиторий остаётся приватным по указанию владельца; этот вопрос до сдачи не решён.', '- Подробные формулы, источники и ограничения: ../MARKET_AND_ECONOMICS.md.', ''])
(ROOT/'PITCH_SCRIPT_RU.md').write_text('\n'.join(notes), encoding='utf-8')
words = sum(len(re.findall(r"\b[\w'-]+\b", s[2])) for s in speech)
report = {'slides': 10, 'bounds_checked': len(BOUNDS), 'speech_words_ru': words, 'words_per_minute_at_five_minutes': words/5, 'source_artifact_sha256': '31776CBBF6329B4E3B9BFFEFB04AEDB16CA59AE5BF9418B94DD8C7B33756CE0D'}
(ROOT/'layout_check_v2.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'pdf': str(DEST), **report}, ensure_ascii=False))
