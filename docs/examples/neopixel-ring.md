
# NeoPixel Ring Rainbow

```blocks
let ring = neoinventor.createNeoPixel(DigitalPin.P8, 16)
ring.showRainbow(1, 360)
basic.forever(function () {
    ring.rotate(1)
    ring.show()
    basic.pause(50)
})
```
