# Yevamos: 3D Temporal Family Graph Visualization

> *A modern approach to an ancient problem: visualizing family relationships that change over time*

**[Live Demo](https://nossonhuebner.github.io/yevamos-vibes/)** | **[Example Graph: Classic Yevamos Case](https://nossonhuebner.github.io/yevamos-vibes/#data=eyJub2RlcyI6eyIxNzY2ODk5NTQ5MTE5LTlicjdnc3k2cCI6eyJuYW1lIjoiWWFha292IiwiZ2VuZGVyIjoibWFsZSIsInBvc2l0aW9uIjp7IngiOi0yLjQ0MDE3NjA4Nzk0OTk2MSwieSI6MTIuNDkwMjc5ODgzODc4Mjg3fSwiaWQiOiIxNzY2ODk5NTQ5MTE5LTlicjdnc3k2cCIsImNvbG9yIjoiI2EzZTYzNSIsImludHJvZHVjZWRTbGljZUluZGV4IjowfSwiMTc2Njg5OTU1ODgwMC1ubXFhdnRlM20iOnsibmFtZSI6IkxlYWgiLCJnZW5kZXIiOiJmZW1hbGUiLCJwb3NpdGlvbiI6eyJ4IjozLjExNTA2NTg1NTkxNDM3NjIsInkiOjEyLjM5MTQyNTIwMjUzNDM2Nn0sImlkIjoiMTc2Njg5OTU1ODgwMC1ubXFhdnRlM20iLCJjb2xvciI6IiNhM2U2MzUiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MH0sIjE3NjY4OTk2NDU1MjYtdTA1aWY2OHJvIjp7Im5hbWUiOiJSZXV2ZW4iLCJnZW5kZXIiOiJtYWxlIiwicG9zaXRpb24iOnsieCI6NC40OTk4MDM4MDA1MTI0MjMsInkiOjYuMzgzNTg5ODA5MTUxNTYxNX0sImlkIjoiMTc2Njg5OTY0NTUyNi11MDVpZjY4cm8iLCJjb2xvciI6IiNmNDcyYjYiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MCwiZGVhdGhTbGljZUluZGV4IjozfSwiMTc2Njg5OTczODI3NS1rY2Mzbmx0emYiOnsibmFtZSI6IkxhdmFuIiwiZ2VuZGVyIjoibWFsZSIsInBvc2l0aW9uIjp7IngiOjExLjEwNzI5NzM0NDc0Nzc5MiwieSI6MTAuNDM4NjQxNTE5MTM3NTZ9LCJpZCI6IjE3NjY4OTk3MzgyNzUta2NjM25sdHpmIiwiY29sb3IiOiIjZmJiZjI0IiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjF9LCIxNzY2ODk5NzY2NjcwLTRrNWE4aTlqYSI6eyJuYW1lIjoiWmlscGFoIiwiZ2VuZGVyIjoiZmVtYWxlIiwicG9zaXRpb24iOnsieCI6OC4xNTM5MjYxOTg5NDA0NTcsInkiOjEwLjQ3MTc5NzM4NDI5NTV9LCJpZCI6IjE3NjY4OTk3NjY2NzAtNGs1YThpOWphIiwiY29sb3IiOiIjZmI5MjNjIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjF9LCIxNzY2ODk5Nzk2ODQ5LWdza2hhMWl0NyI6eyJuYW1lIjoiUm9jaGVsIiwiZ2VuZGVyIjoiZmVtYWxlIiwicG9zaXRpb24iOnsieCI6OC43OTY3OTMwODY5OTY2MzEsInkiOjYuNDA0NzA1MDg1MDQ2NTI5fSwiaWQiOiIxNzY2ODk5Nzk2ODQ5LWdza2hhMWl0NyIsImNvbG9yIjoiIzM0ZDM5OSIsImludHJvZHVjZWRTbGljZUluZGV4IjoxfSwiMTc2Njg5OTgyNTA3OS0wbWllNmdkOXciOnsibmFtZSI6IkRpbmEiLCJnZW5kZXIiOiJmZW1hbGUiLCJwb3NpdGlvbiI6eyJ4IjoxMS44MjUzNTY0NTQwODA5NjYsInkiOjQuNTU2MDgyNzI5ODMzNDI5fSwiaWQiOiIxNzY2ODk5ODI1MDc5LTBtaWU2Z2Q5dyIsImNvbG9yIjoiI2MwODRmYyIsImludHJvZHVjZWRTbGljZUluZGV4IjoxfSwiMTc2Njg5OTg5OTg5Ni14ampjbXowZzAiOnsibmFtZSI6IlNoaW1vbiIsImdlbmRlciI6Im1hbGUiLCJwb3NpdGlvbiI6eyJ4IjotMC44MjYxMDg4MDYyODM5ODk2LCJ5Ijo0LjU0MjIwNTQzOTIwMzcyN30sImlkIjoiMTc2Njg5OTg5OTg5Ni14ampjbXowZzAiLCJjb2xvciI6IiNmZjZiNmIiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MCwiZGVhdGhTbGljZUluZGV4Ijo1fSwiMTc2NjkwMDAwMzQ3OC0wdDExZ2ZyeWoiOnsibmFtZSI6IkxldmkiLCJnZW5kZXIiOiJtYWxlIiwicG9zaXRpb24iOnsieCI6LTYuNzk2NjkzNjQ0NjY4Mzc2LCJ5IjowLjI5MTEzMjM1MTcwMDg0MDJ9LCJpZCI6IjE3NjY5MDAwMDM0NzgtMHQxMWdmcnlqIiwiY29sb3IiOiIjYTg1NWY3IiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjR9fSwiZWRnZXMiOnsiMTc2Njg5OTYwNDkzMy14eDFodHozaDgiOnsidHlwZSI6Im5pc3VpbiIsInNvdXJjZUlkIjoiMTc2Njg5OTU1ODgwMC1ubXFhdnRlM20iLCJ0YXJnZXRJZCI6IjE3NjY4OTk1NDkxMTktOWJyN2dzeTZwIiwiaWQiOiIxNzY2ODk5NjA0OTMzLXh4MWh0ejNoOCIsImludHJvZHVjZWRTbGljZUluZGV4IjowLCJjaGlsZElkcyI6WyIxNzY2ODk5NjQ1NTI2LXUwNWlmNjhybyIsIjE3NjY4OTk4OTk4OTYteGpqY216MGcwIiwiMTc2NjkwMDAwMzQ3OC0wdDExZ2ZyeWoiXX0sIjE3NjY4OTk2NDU1MjYtaDJ6c2xhb24wIjp7ImlkIjoiMTc2Njg5OTY0NTUyNi1oMnpzbGFvbjAiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2ODk5NTU4ODAwLW5tcWF2dGUzbSIsInRhcmdldElkIjoiMTc2Njg5OTY0NTUyNi11MDVpZjY4cm8iLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4IjowfSwiMTc2Njg5OTY0NTUyNi01ZjVvOG1tMzMiOnsiaWQiOiIxNzY2ODk5NjQ1NTI2LTVmNW84bW0zMyIsInR5cGUiOiJwYXJlbnQtY2hpbGQiLCJzb3VyY2VJZCI6IjE3NjY4OTk1NDkxMTktOWJyN2dzeTZwIiwidGFyZ2V0SWQiOiIxNzY2ODk5NjQ1NTI2LXUwNWlmNjhybyIsImhpZGRlbiI6dHJ1ZSwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjB9LCIxNzY2ODk5NzgzODYwLTRoMTQ2bmQ5dCI6eyJ0eXBlIjoidW5tYXJyaWVkLXJlbGF0aW9ucyIsInNvdXJjZUlkIjoiMTc2Njg5OTczODI3NS1rY2Mzbmx0emYiLCJ0YXJnZXRJZCI6IjE3NjY4OTk3NjY2NzAtNGs1YThpOWphIiwiaWQiOiIxNzY2ODk5NzgzODYwLTRoMTQ2bmQ5dCIsImludHJvZHVjZWRTbGljZUluZGV4IjoxLCJjaGlsZElkcyI6WyIxNzY2ODk5Nzk2ODQ5LWdza2hhMWl0NyIsIjE3NjY4OTk4MjUwNzktMG1pZTZnZDl3Il19LCIxNzY2ODk5Nzk2ODQ5LXB6NXU3M3NkNSI6eyJpZCI6IjE3NjY4OTk3OTY4NDktcHo1dTczc2Q1IiwidHlwZSI6InBhcmVudC1jaGlsZCIsInNvdXJjZUlkIjoiMTc2Njg5OTczODI3NS1rY2Mzbmx0emYiLCJ0YXJnZXRJZCI6IjE3NjY4OTk3OTY4NDktZ3NraGExaXQ3IiwiaGlkZGVuIjp0cnVlLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MX0sIjE3NjY4OTk3OTY4NDktaXczY2d2ZmV6Ijp7ImlkIjoiMTc2Njg5OTc5Njg0OS1pdzNjZ3ZmZXoiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2ODk5NzY2NjcwLTRrNWE4aTlqYSIsInRhcmdldElkIjoiMTc2Njg5OTc5Njg0OS1nc2toYTFpdDciLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4IjoxfSwiMTc2Njg5OTgyNTA3OS1waTFndDRieTgiOnsiaWQiOiIxNzY2ODk5ODI1MDc5LXBpMWd0NGJ5OCIsInR5cGUiOiJwYXJlbnQtY2hpbGQiLCJzb3VyY2VJZCI6IjE3NjY4OTk3MzgyNzUta2NjM25sdHpmIiwidGFyZ2V0SWQiOiIxNzY2ODk5ODI1MDc5LTBtaWU2Z2Q5dyIsImhpZGRlbiI6dHJ1ZSwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjF9LCIxNzY2ODk5ODI1MDc5LW5lNzc4NjltNiI6eyJpZCI6IjE3NjY4OTk4MjUwNzktbmU3Nzg2OW02IiwidHlwZSI6InBhcmVudC1jaGlsZCIsInNvdXJjZUlkIjoiMTc2Njg5OTc2NjY3MC00azVhOGk5amEiLCJ0YXJnZXRJZCI6IjE3NjY4OTk4MjUwNzktMG1pZTZnZDl3IiwiaGlkZGVuIjp0cnVlLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MX0sIjE3NjY4OTk4NTg2MDktYWpxNTl1ZHNxIjp7InR5cGUiOiJlcnVzaW4iLCJzb3VyY2VJZCI6IjE3NjY4OTk2NDU1MjYtdTA1aWY2OHJvIiwidGFyZ2V0SWQiOiIxNzY2ODk5Nzk2ODQ5LWdza2hhMWl0NyIsImlkIjoiMTc2Njg5OTg1ODYwOS1hanE1OXVkc3EiLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6MX0sIjE3NjY4OTk4OTk4OTYtb2RtNmFvbW95Ijp7ImlkIjoiMTc2Njg5OTg5OTg5Ni1vZG02YW9tb3kiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2ODk5NTU4ODAwLW5tcWF2dGUzbSIsInRhcmdldElkIjoiMTc2Njg5OTg5OTg5Ni14ampjbXowZzAiLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4IjowfSwiMTc2Njg5OTg5OTg5Ni1zd2RxOG90ZDIiOnsiaWQiOiIxNzY2ODk5ODk5ODk2LXN3ZHE4b3RkMiIsInR5cGUiOiJwYXJlbnQtY2hpbGQiLCJzb3VyY2VJZCI6IjE3NjY4OTk1NDkxMTktOWJyN2dzeTZwIiwidGFyZ2V0SWQiOiIxNzY2ODk5ODk5ODk2LXhqamNtejBnMCIsImhpZGRlbiI6dHJ1ZSwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjB9LCIxNzY2ODk5OTYxNzUyLWR6a3NhZmx5MCI6eyJ0eXBlIjoibmlzdWluIiwic291cmNlSWQiOiIxNzY2ODk5ODk5ODk2LXhqamNtejBnMCIsInRhcmdldElkIjoiMTc2Njg5OTgyNTA3OS0wbWllNmdkOXciLCJpZCI6IjE3NjY4OTk5NjE3NTItZHprc2FmbHkwIiwiaW50cm9kdWNlZFNsaWNlSW5kZXgiOjJ9LCIxNzY2OTAwMDAzNDc4LW13YWgyZXBvZSI6eyJpZCI6IjE3NjY5MDAwMDM0NzgtbXdhaDJlcG9lIiwidHlwZSI6InBhcmVudC1jaGlsZCIsInNvdXJjZUlkIjoiMTc2Njg5OTU1ODgwMC1ubXFhdnRlM20iLCJ0YXJnZXRJZCI6IjE3NjY5MDAwMDM0NzgtMHQxMWdmcnlqIiwiaGlkZGVuIjp0cnVlLCJpbnRyb2R1Y2VkU2xpY2VJbmRleCI6NH0sIjE3NjY5MDAwMDM0NzgteW5vZGt0Zjl2Ijp7ImlkIjoiMTc2NjkwMDAwMzQ3OC15bm9ka3RmOXYiLCJ0eXBlIjoicGFyZW50LWNoaWxkIiwic291cmNlSWQiOiIxNzY2ODk5NTQ5MTE5LTlicjdnc3k2cCIsInRhcmdldElkIjoiMTc2NjkwMDAwMzQ3OC0wdDExZ2ZyeWoiLCJoaWRkZW4iOnRydWUsImludHJvZHVjZWRTbGljZUluZGV4Ijo0fX0sInNsaWNlcyI6W3siaWQiOiIxNzY2ODk5NTEzMzIyLXVuZDhzOGJxciIsImxhYmVsIjoiUmV1dmVuIGFuZCBTaGltb24gYXJlIHBhdGVybmFsIGJyb3RoZXJzIiwiZXZlbnRzIjpbeyJ0eXBlIjoiYWRkTm9kZSIsIm5vZGVJZCI6IjE3NjY4OTk1NDkxMTktOWJyN2dzeTZwIn0seyJ0eXBlIjoiYWRkTm9kZSIsIm5vZGVJZCI6IjE3NjY4OTk1NTg4MDAtbm1xYXZ0ZTNtIn0seyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY4OTk2MDQ5MzMteHgxaHR6M2g4In0seyJ0eXBlIjoiYWRkTm9kZSIsIm5vZGVJZCI6IjE3NjY4OTk2NDU1MjYtdTA1aWY2OHJvIn0seyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY4OTk2NDU1MjYtaDJ6c2xhb24wIn0seyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY4OTk2NDU1MjYtNWY1bzhtbTMzIn0seyJ0eXBlIjoiYWRkTm9kZSIsIm5vZGVJZCI6IjE3NjY4OTk4OTk4OTYteGpqY216MGcwIn0seyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY4OTk4OTk4OTYtb2RtNmFvbW95In0seyJ0eXBlIjoiYWRkRWRnZSIsImVkZ2VJZCI6IjE3NjY4OTk4OTk4OTYtc3dkcThvdGQyIn1dfSx7ImlkIjoiMTc2Njg5OTY3MDAyNC1jYW13bHliaDgiLCJsYWJlbCI6IlJldXZlbiBtYXJyaWVzIFJvY2hlbCIsImV2ZW50cyI6W3sidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5NzAzMDI2LTRoZDIzeXJsZiJ9LHsidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2ODk5NzM4Mjc1LWtjYzNubHR6ZiJ9LHsidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2ODk5NzY2NjcwLTRrNWE4aTlqYSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5NzgzODYwLTRoMTQ2bmQ5dCJ9LHsidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2ODk5Nzk2ODQ5LWdza2hhMWl0NyJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5Nzk2ODQ5LXB6NXU3M3NkNSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5Nzk2ODQ5LWl3M2NndmZleiJ9LHsidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2ODk5ODI1MDc5LTBtaWU2Z2Q5dyJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5ODI1MDc5LXBpMWd0NGJ5OCJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5ODI1MDc5LW5lNzc4NjltNiJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5ODU4NjA5LWFqcTU5dWRzcSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5ODczNjYyLXphZHM5eXM5OSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2ODk5ODczNjYyLWwxMm51aXYydCJ9XX0seyJpZCI6IjE3NjY4OTk5MzM5ODItM2sydG1zMHg5IiwibGFiZWwiOiJTaGltb24gbWFycmllcyBSb2NoZWwncyBzaXN0ZXIsIERpbmEiLCJldmVudHMiOlt7InR5cGUiOiJhZGRFZGdlIiwiZWRnZUlkIjoiMTc2Njg5OTk2MTc1Mi1kemtzYWZseTAifV19LHsiaWQiOiIxNzY2ODk5OTcyNTM5LTJtMGZvaDB1MiIsImxhYmVsIjoiUmV1dmVuIGRpZXMgY2hpbGRsZXNzLiBIaXMgd2lmZSBSb2NoZWwgZG9lcyBub3QgZmFsbCB0byBZaWJidW0gdG8gU2hpbW9uIHNpbmNlIHNoZSBpcyBoaXMgd2lmZSBEaW5hJ3Mgc2lzdGVyIiwiZXZlbnRzIjpbeyJ0eXBlIjoiZGVhdGgiLCJub2RlSWQiOiIxNzY2ODk5NjQ1NTI2LXUwNWlmNjhybyJ9XX0seyJpZCI6IjE3NjY4OTk5OTMwMDUtYmlhZzg0dnRxIiwibGFiZWwiOiJZYWFrb3YgYW5kIExlYWggaGF2ZSBhbm90aGVyIHNvbiwgTGV2aSIsImV2ZW50cyI6W3sidHlwZSI6ImFkZE5vZGUiLCJub2RlSWQiOiIxNzY2OTAwMDAzNDc4LTB0MTFnZnJ5aiJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2OTAwMDAzNDc4LW13YWgyZXBvZSJ9LHsidHlwZSI6ImFkZEVkZ2UiLCJlZGdlSWQiOiIxNzY2OTAwMDAzNDc4LXlub2RrdGY5diJ9XX0seyJpZCI6IjE3NjY5MDAxMzExOTktN2lqN2toYWN3IiwibGFiZWwiOiJTaGltb24gZGllcywgRGluYSBmYWxscyBhcyBhIHlldmFtYSB0byBMZXZpIiwiZXZlbnRzIjpbeyJ0eXBlIjoiZGVhdGgiLCJub2RlSWQiOiIxNzY2ODk5ODk5ODk2LXhqamNtejBnMCJ9XX1dLCJtZXRhZGF0YSI6eyJ0aXRsZSI6IlNhbXBsZSIsImRlc2NyaXB0aW9uIjoiIn19)**

---

## The Problem: Time as a Missing Dimension

Family trees are inherently two-dimensional structures—parents above, children below, siblings side-by-side. But families don't exist in a single frozen moment. People are born, marry, divorce, and die. Relationships transform. A woman who was forbidden to one man may later become obligated to marry him. A brother who didn't exist when a marriage occurred changes the entire legal picture when he's born.

Traditional diagrams attempt to represent these temporal changes within a flat 2D space. The results are predictably cluttered:

- **Numbered annotations** ("1. Reuven marries Leah, 2. Reuven dies, 3. Shimon performs yibum...")
- **Multiple line styles** (solid for current marriages, dashed for past, dotted for potential)
- **Color-coded overlays** that require a legend to decode
- **Separate diagrams** for each point in time, losing the continuity between states

These approaches all share the same fundamental limitation: they're trying to squeeze a third dimension (time) into a space that's already fully utilized. The result is cognitive overload—readers must mentally reconstruct the temporal sequence from visual noise.

## The Solution: Time as the Z-Axis

Yevamos takes a different approach: **what if time literally *were* a third dimension?**

Each moment in the family's history exists on its own 2D plane. These planes are stacked along the Z-axis, creating a 3D space where you can see the entire history at once—or focus on a single moment. Navigate forward and backward through time like flipping through pages, while maintaining spatial awareness of where you've been and where you're going.

```
        Z (Time)
        ↑
        │    ┌─────────────┐
        │    │  t=2: Now   │  ← Current slice (bright, interactive)
        │    └─────────────┘
        │   ┌─────────────┐
        │   │  t=1: Past  │    ← Previous state (faded)
        │   └─────────────┘
        │  ┌─────────────┐
        │  │ t=0: Start  │     ← Initial state (faded)
        │  └─────────────┘
        └──────────────────→ X,Y (Family relationships)
```

## Background: Yibum and Chalitzah

This tool was built specifically to visualize cases from **Tractate Yevamos** in the Talmud, which deals with *yibum* (levirate marriage) and *chalitzah* (the release ceremony).

### The Basic Law

When a married man dies without children, the Torah prescribes a specific obligation: his brother should marry the widow. This is *yibum*—from the Hebrew *yavam* (brother-in-law). The firstborn son of this union is considered, in a legal sense, a continuation of the deceased brother's line.

If the brother chooses not to perform yibum, he must perform *chalitzah*—a ceremony releasing both parties from the obligation, after which the widow may marry anyone.

### Why It Gets Complicated

The Talmud dedicates an entire tractate to this topic because the interactions between multiple brothers, multiple wives, and forbidden relationships create intricate logical puzzles:

- **Multiple brothers**: If a man had several brothers, which one should perform yibum?
- **Multiple wives**: If the deceased had multiple wives, what happens to each?
- **Forbidden relationships**: What if the widow is the brother's sister-in-law through *another* marriage? Or his wife's sister?
- **Temporal complications**: What if a brother was born *after* the original marriage? What if he converted to Judaism after the death?

These cases require tracking not just *who* is related to *whom*, but *when* each relationship began and ended, and how the legal picture changes at each moment.

## Technical Architecture

### Delta-Based Temporal Model

Rather than storing complete snapshots of the family state at each point in time, Yevamos uses a **delta-based model**:

```typescript
interface TemporalGraph {
  nodes: Record<string, Person>;       // Global person definitions
  edges: Record<string, Relationship>; // Global relationship definitions
  slices: TimeSlice[];                 // Timeline of events
}

interface TimeSlice {
  id: string;
  label: string;                       // "Reuven dies", "Shimon is born", etc.
  events: TemporalEvent[];             // What changes at this moment
}
```

**Global definitions** store immutable properties (name, gender, node color). **Time slices** store events that modify the graph state. To render any point in time, the system resolves all events up to that slice index.

This approach offers several advantages:
- **Efficient storage**: Only changes are recorded, not redundant full states
- **Clean diffs**: Easy to see exactly what changed between any two moments
- **Flexible insertion**: New time slices can be inserted anywhere in the sequence

### Event Types

| Event | Description |
|-------|-------------|
| `addNode` | A person enters the family (birth, marriage into family, etc.) |
| `death` | A person dies (visually faded, legally significant) |
| `addEdge` | A relationship is created (marriage, birth of child) |
| `updateEdge` | A relationship changes (marriage → divorce) |
| `removeEdge` | A relationship is removed |

### Relationship Types

In Halacha, a full Jewish marriage has two stages: *erusin* (betrothal/kiddushin) and *nisuin* (full marriage). A woman who has undergone erusin is forbidden to other men, but the marriage is not yet complete until nisuin is performed. Either stage can be dissolved through divorce.

| Type | Visual Style | Description |
|------|--------------|-------------|
| `erusin` | Solid pink | Betrothal - first stage of marriage |
| `nisuin` | Pink with light blue sandwich | Full marriage - both stages complete |
| `divorce` | Dashed red | Dissolved marriage |
| `yibum` | Solid gold (thick) | Levirate marriage performed |
| `chalitzah` | Dashed purple | Release ceremony performed |
| `parent-child` | Solid cyan with arrow | Parent-child relationship |
| `sibling` | Solid gray (thin) | Sibling relationship |
| `unmarried-relations` | Dotted orange | Non-marital relationship |

**Relationship transitions:**
- Unmarried → Erusin (betrothal only)
- Unmarried → Nisuin (both stages at once)
- Erusin → Nisuin (complete the marriage)
- Erusin → Divorce
- Nisuin → Divorce

Children can be added to any of: erusin, nisuin, or unmarried-relations.

### 3D Rendering

Built with **React Three Fiber** (React bindings for Three.js):

- Each time slice is a semi-transparent vertical plane positioned along the Z-axis
- People are rendered as colored nodes with emoji indicators
- Relationships are rendered as styled lines (solid, dashed, dotted)
- **Cross-slice continuity lines** connect the same person across adjacent time slices
- **Folder-tab navigation** on each slice for quick temporal navigation

### Persistence & Sharing

**Three persistence mechanisms:**

1. **Auto-save**: Graphs automatically persist to `localStorage`
2. **JSON Export/Import**: Download and upload complete graph files
3. **URL Encoding**: Share graphs via URL using Base64-encoded data in the hash fragment

```
https://example.com/yevamos#data=eyJ0aXRsZSI6IkNsYXNza...
```

The URL encoding allows sharing complex family scenarios with a single link—useful for Torah study, classroom instruction, or halachic discussions.

## Features

### Interactive Editing
- **Add people** via right-click context menu
- **Create relationships** by selecting two people
- **Drag nodes** to arrange the family layout
- **Multi-select** with Shift+drag for group operations
- **Mark deaths** to show temporal transitions

### Navigation
- **Timeline slider** for quick scrubbing through history
- **Arrow keys** (←→ or ↑↓) for slice-by-slice navigation
- **Clickable folder tabs** on each slice for direct access
- **Overview mode**: Orbit camera to see all slices at once
- **Focus mode**: Animated walkthrough with playback controls

### Playback
- **Play/Pause** automatic progression through time
- **Speed control**: Slow (3s), Medium (2s), Fast (1s) per slice
- **Change highlighting**: New people glow green, deaths glow red

### Localization
- English and Hebrew interface
- RTL support for Hebrew text

## Future Directions

### LLM-Powered Graph Generation
Natural language input to generate family graphs:
> "Reuven has two brothers, Shimon and Levi. Reuven marries Leah and Rachel. Reuven dies childless. What are the yibum obligations?"

An LLM could parse this description and generate the corresponding temporal graph, making the tool accessible to users without manual graph construction.

### Halachic Overlay
Integration with Talmudic sources:
- Link graph states to specific Gemara passages
- Display relevant halachic arguments at each time slice
- Show which Rishonim/Acharonim discuss each case configuration

### Safek (Doubt) Handling via Slice Forking
When the facts are uncertain, Jewish law often requires considering multiple possibilities. The graph could support **forking**—a single slice branches into multiple parallel timelines representing different factual scenarios, each with its own halachic implications.

```
                    ┌─→ [If child is viable] → ...
       t=2 ────────┤
                    └─→ [If child is not viable] → ...
```

### Additional UI Improvements
- **Minimap**: Small overview showing position in the full timeline
- **Search**: Find people or relationships across all time slices
- **Annotations**: Add notes and citations to specific graph elements
- **Diff view**: Side-by-side comparison of two time slices
- **Export to image/PDF**: Generate static diagrams for print

### Collaborative Editing
Real-time multi-user editing for chavrusa study or classroom use.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** with TypeScript
- **Three.js** via React Three Fiber + Drei
- **Zustand** for state management
- **Vite** for build tooling

## License

MIT License - See [LICENSE](LICENSE) for details.

---

*Built to illuminate the intricate logic of Tractate Yevamos, but applicable to any domain where family relationships evolve over time.*
