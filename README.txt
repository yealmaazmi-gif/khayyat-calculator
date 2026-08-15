KHAYYAT BUSINESS CALCULATOR — V6 REBUILD

This version was rebuilt from the business logic, not patched from earlier versions.

CALCULATION MODEL
=================

1) TOTAL FIXED MONTHLY COST
---------------------------
Annual Rent / 12
+ Electricity / Month
+ Water / Month
+ Internet & Phone / Month
+ Trade License / 12
+ Insurance / 12
+ Marketing / Month
+ Maintenance / Month
+ Other Fixed Cost / Month
+ Extra Custom Fixed Costs
+ Fixed Salary Staff
+ Visa Monthly Provision

2) FIXED SALARY STAFF
---------------------
For each role:
Quantity × Monthly Salary per Person

3) VISA MONTHLY PROVISION
-------------------------
Number of Visas × Cost per Visa
÷ (12 × Visa Period in Years)

4) FABRIC / TAQA COST PER KANDURA
---------------------------------
Taqa Cost ÷ Kanduras from One Taqa
× (1 + Waste %)

5) PER-KANDURA LABOR
--------------------
For each labor type:
Quantity × Pay per Kandura per Worker

Then all labor rows are added together.

6) OTHER VARIABLE COSTS
-----------------------
Buttons, packaging, embroidery, delivery, accessories, etc.
All are entered directly as AED per kandura.

7) VARIABLE COST PER KANDURA
----------------------------
Fabric Cost
+ Per-Kandura Labor
+ Other Variable Costs

8) CONTRIBUTION PER KANDURA
---------------------------
Selling Price - Variable Cost per Kandura

9) BREAK-EVEN KANDURAS / MONTH
------------------------------
Total Fixed Monthly Cost
÷ Contribution per Kandura

10) QUANTITY FOR TARGET PROFIT
------------------------------
(Total Fixed Monthly Cost + Target Monthly Net Profit)
÷ Contribution per Kandura

11) FULL COST PER KANDURA AT PLANNED VOLUME
--------------------------------------------
Variable Cost per Kandura
+ Total Fixed Monthly Cost ÷ Planned Kanduras per Month

12) PRICE FOR NET ZERO AT PLANNED VOLUME
-----------------------------------------
Same as full cost per kandura at planned volume.

13) PRICE FOR TARGET PROFIT AT PLANNED VOLUME
----------------------------------------------
Variable Cost per Kandura
+ (Total Fixed Monthly Cost + Target Profit)
÷ Planned Kanduras per Month

IMPORTANT
=========
- Blank inputs are treated as zero.
- Zero inputs are treated as zero.
- Every input auto-saves locally.
- Fixed staff and per-kandura labor are separate.
- Per-kandura labor includes Quantity × Rate per Kandura per Worker.
- Visa count is entered independently.
- Fabric/Taqa has a name field.
- Dashboard shows break-even based on the actual selling price you entered.
- Existing older versions are not automatically mixed into this new clean model.
