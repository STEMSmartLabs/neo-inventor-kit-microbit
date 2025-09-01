
let dist = 0
let strip = neoinventor.createNeoPixel(DigitalPin.P8, 16)
basic.forever(function () {
    neoinventor.setServoAngle(AnalogPin.P0, 90)
    dist = neoinventor.ultrasonicCm(DigitalPin.P1, DigitalPin.P2)
    neoinventor.setFan(AnalogPin.P12, 75)
    neoinventor.buzzerTone(AnalogPin.P0, 880, 200)
    neoinventor.setLed(DigitalPin.P16, true)
    let l = neoinventor.readLDR(AnalogPin.P2)
    let s = neoinventor.readSwitch(DigitalPin.P5)
    let p = neoinventor.readTrimpotPercent(AnalogPin.P1)
    strip.showRainbow(1, 360)
    strip.rotate(1)
    strip.show()
    basic.pause(50)
})
