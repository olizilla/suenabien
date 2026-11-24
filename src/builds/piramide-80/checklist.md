<!-- Generated from suena-bien-boxes/docs/piramide-80-checklist.md: edit there, not here. -->

## Before cutting

- **Driver hole.** From Celestion's drawing:
  - The cut-out is 415 mm in the front and in the doubler ring. Test-fit the basket through the doubler, because the basket may flare just behind the flange. Open the hole to about 420 mm if it's tight.
  - The frame is 460 mm. That leaves 4.7 cm of flat wood to the nearest mouth corner, and 5.7 cm from the bolt slots.
  - Behind the front, the doubler ring (49 cm across) clears the duct panels by 2 cm.
- **Bolts.** The driver has 8 slots, 7 × 12 mm, on a 431–439 mm circle, every 45°. Mark them from the driver itself. Use M6 bolts into tee nuts (or hurricane nuts) behind the 27 mm of front and doubler. Wood screws strip after a few removals.
- **Depth.** The driver reaches 233 mm behind the front face and is 160 mm across at the magnet. The front ring brace at 22 cm runs round the walls, well clear of the basket.
- **Mirrored pairs.** Build two boxes with ducts top-left and bottom-right, and two with ducts top-right and bottom-left. The 2 × 2 stack then meets as a stepped diamond without turning any box, and the handles stay on the sides.
- **Handles.** Fit recessed cups in the sides, between the ring braces: about 25–46 cm back and centred on the height. The weight centre is about 34 cm back, because the driver is at the front. The cups clear the duct panel by about 1.5 cm at the wall, so check them against your actual cups.

## Building

- **Duct panels.** Glue both long edges along their full length. A gap leaks air alongside the port: it can whistle and moves the tuning.
- **Printed wedges.** Each mouth has four pockets behind its front panel, where the triangular duct is wider than the stepped hole: two behind the teeth and two where the end steps meet the walls. Fill each with a 3D-printed wedge (see the mouth detail). That's 8 per box: 4 tooth wedges and 4 end wedges, two of them mirrored.
  - **Shape:** each wedge carries the step straight back, then eases down to the duct panel over 12 cm on a smooth S-curve.
  - **Material:** PETG or ASA, not PLA, which softens at about 55 °C in a hot van. Use 4 or more walls and 30–40% infill, so it doesn't buzz.
  - **Fixing:** glue with polyurethane construction adhesive or epoxy (PVA doesn't grip PETG). Fit the wedges before the front goes on, using the dry-fitted front as the stop. Allow about 1 mm of gap for the adhesive.
- **Round-overs:**
  - The tooth tips stay square: that's the Pirámide look.
  - Give the mouths' front edges a light 6 mm round-over, including the wall ends inside each mouth. The outline still reads as crisp steps.
  - Round both faces of the duct panels' inner (back) end edge, about 6 mm.
- **Seal everything.** Glue every joint, and fit a gasket on the driver and on the connector plate. Leaks chuff and whistle like a bad port.
- **Wadding.** Fit 5 cm on the two quarters of the back away from the duct ends. Keep it at least 10 cm from the duct openings.

## Measuring and setting up

- **Tuning.** Check it on the first box with the back clamped or screwed on with a gasket.
  - With an impedance meter (DATS, or REW with a resistor), the dip between the two peaks is the tuning.
  - The low-tech way: play a quiet slow sine sweep and find where the cone barely moves while the ports blow hardest.
- **Don't trim to tune.** A centimetre of duct moves the tuning only about 0.13 Hz, and 6 cm moves it about 1 Hz. Anything from 23 to 27 Hz is fine. Set the DSP high-pass (LR4) to 0.8 × the measured tuning, which is about 20 Hz for 25 Hz.
- **Low-pass at 100 Hz or below.** The duct's pipe resonance and the box's front-to-back resonance both sit near 220 Hz. An LR4 at 100 Hz takes them down by about 28 dB.
- **Amp.** The TSQ1845 is 8 Ω and rated 1800 W (AES). The Q10 gives 1200 W into 8 Ω (98 V) on one box per channel. Two boxes in parallel make 4 Ω (95.4 V), which costs about 0.2 dB per box.
- **Transport.** The driver flange stands 13 mm proud of the front. Fit a grille, or a cover for moving. Keep any grille clear of the port mouths, or use open mesh over them.

## Port noise (chuffing)

The air moves fastest in the stepped mouths. These are the model's air speeds with each box playing about 110 dB at 1 m. That's roughly four boxes giving 100 dB at the desk:

| Frequency | 25 Hz | 30 Hz | 35 Hz | 40 Hz |
|---|---|---|---|---|
| Air speed in the mouth | 10 m/s | 6 m/s | 4 m/s | 2.5 m/s |

- **Rounded edges stay quiet up to about 17 m/s,** which this box reaches only at its 114 dB ceiling at 25 Hz.
- **Sharp edges can start to hiss from about 10 m/s.**

The noisy spots would be:
- the mouths' front edges, including the square tooth tips;
- the pockets behind the teeth, where air leaving the duct hits the back of the front panel;
- the duct's inner end;
- any leak.

The printed wedges deal with the pockets, and the round-overs and sealing deal with the rest. Square tooth tips with a 6 mm round-over on the face edges should be quiet at normal levels. Totally sharp edges would bring the onset of noise down by roughly 4–5 dB at 25 Hz, to about 110 dB per box, which is around a loud night's level.
