KHAYYAT BUSINESS CALCULATOR
حاسبة الخياط الرجالي

PURPOSE
-------
A simple offline business feasibility calculator for a men's tailoring shop.

MAIN INPUTS
-----------
- Annual shop rent
- Monthly electricity, water, internet/phone
- Annual license and insurance
- Marketing, maintenance and other fixed monthly costs
- Custom monthly overhead items
- Fixed-salary employee roles, employee count and salary per person
- Visa/residency cost per employee and visa cycle
- Taqa/fabric batch purchase cost
- Kanduras produced from one taqa
- Fabric waste percentage
- Tailor payment per kandura
- Other labor, accessories, packaging and other variable costs
- Selling price per kandura
- Planned kanduras per month
- Target monthly profit
- Working days per month

OUTPUTS
-------
- Monthly fixed overhead
- Fabric cost per kandura
- Total variable cost per kandura
- Contribution/profit per kandura before fixed overhead
- Break-even kanduras per month
- Break-even kanduras per working day
- Kanduras required for target monthly profit
- Monthly revenue, total cost and net profit
- Cost breakdown chart
- Monthly sales scenarios
- Profit curve
- Selling-price scenarios

DATA
----
The calculator saves its values locally in the browser/device using localStorage.
Use Data > Export Backup regularly.
No cloud or account is required.

GITHUB PAGES
------------
Upload these seven files to a NEW public GitHub repository:
index.html
style.css
script.js
manifest.json
service-worker.js
icon-192.png
icon-512.png

Then:
Settings > Pages > Deploy from a branch > main > /(root) > Save.

ANDROID
-------
Open the GitHub Pages URL in Chrome.
Menu > Add to Home screen / Install app.

IPHONE
------
Open the GitHub Pages URL in Safari.
Share > Add to Home Screen > Add.

V2 - FULL COST & EDITABLE INPUTS
--------------------------------
- Every input updates calculations immediately.
- Inputs remain editable.
- Changes auto-save locally and there is a Save Changes button.
- Full Cost / Kandura = variable cost + allocated fixed monthly overhead.
- Fixed overhead allocation uses Planned Kanduras / Month.
- Net Profit / Kandura is shown at planned monthly volume.
- Live result panels added to Costs and Workers.
- Existing V1 backup remains compatible.
