KHAYYAT BUSINESS CALCULATOR — V3

This version rebuilds the calculation model.

IMPORTANT LOGIC
---------------
Every entered number is saved locally and included in calculations.
Blank/zero values are treated as zero.

FIXED MONTHLY COST
------------------
Annual Rent / 12
+ annual License / 12
+ annual Insurance / 12
+ electricity
+ water
+ internet
+ marketing
+ maintenance
+ other fixed monthly costs
+ custom monthly fixed costs
+ fixed-salary staff
+ monthly visa provision

MONTHLY VISA PROVISION
----------------------
Visa Count × Cost per Visa / (12 × Visa Cycle Years)

VARIABLE COST PER KANDURA
-------------------------
Fabric Cost per Kandura
+ all Per-Kandura Labor rates
+ all Other Variable Costs per Kandura

FABRIC COST PER KANDURA
-----------------------
(Taqa Cost / Kanduras from Taqa) × (1 + Waste %)

FULL COST PER KANDURA
---------------------
Variable Cost per Kandura
+ Monthly Fixed Cost / Planned Kanduras per Month

BREAK-EVEN QUANTITY
-------------------
Monthly Fixed Cost / (Selling Price - Variable Cost per Kandura)

QUANTITY FOR TARGET PROFIT
--------------------------
(Monthly Fixed Cost + Target Monthly Profit) /
(Selling Price - Variable Cost per Kandura)

PRICE FOR NET ZERO AT PLANNED VOLUME
------------------------------------
Variable Cost per Kandura + Monthly Fixed Cost / Planned Units

PRICE FOR TARGET PROFIT AT PLANNED VOLUME
-----------------------------------------
Variable Cost per Kandura +
(Monthly Fixed Cost + Target Profit) / Planned Units

NOTES
-----
- Fixed-salary staff can be added with count and monthly salary.
- Per-kandura labor can be added separately with one rate per kandura for each labor stage.
- Visa count is independent, so you enter the total number of visas directly.
- Every input auto-saves. Save Now is also available.
- Export/Import backup included.
- Works offline after first load.


V4 - ENGLISH + ARABIC LABELS
----------------------------
- Added Arabic translation beside the main English labels throughout the app.
- Added Arabic wording to key helper text and dynamic staff/cost rows.
- Calculation model is unchanged from V3.
- Data/storage model is unchanged, so existing V3 saved values remain compatible.
- Recommended improvement path from here: use real business inputs first before adding more complexity.
