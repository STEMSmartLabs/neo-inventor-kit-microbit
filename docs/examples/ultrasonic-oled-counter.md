
# Ultrasonic + OLED Visitor Counter

Requires **OLED** dependency (installed with this package).

```blocks
oled.init(128, 64)
let visitor = 0
let last = input.runningTime()

basic.forever(function () {
    let d = neoinventor.ultrasonicCm(DigitalPin.P1, DigitalPin.P2)
    if (d > 0 && d < 50 && input.runningTime() - last > 2000) {
        visitor += 1
        last = input.runningTime()
    }
    oled.clear()
    oled.showString("Dist: " + d + "cm", 0, 0)
    oled.showString("Count: " + visitor, 0, 16)
    basic.pause(100)
})
```
