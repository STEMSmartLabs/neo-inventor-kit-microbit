
// Neo Inventor Kit — fixed pin mapping with auto-init (disables LED matrix)
// Calling any public block will ensure led.enable(false) is run exactly once.

// Pins (per your board):
// P2: Servo
// P12: NeoPixel ring
// P7: Fan (PWM)
// P15: Humidity (analog)
// P8: LED
// P9: IR receiver
// P1: LDR (analog)
// Trig P13, Echo P14: Ultrasonic
// P10: Buzzer (tone)
// P3: Button (active-low w/ pull-up)
// P0: Trimpot (analog)
// P4: On/Off switch (active-low w/ pull-up)

//% color=#FF8C00 icon="\uf135" block="Neo Inventor Kit" weight=90
namespace neoinventor {
    // ===== One-time init (disable 5x5 LED matrix so P4, P7, P9, P10 are free) =====
    let __inited = false
    function __ensureInit(): void {
        if (__inited) return
        __inited = true
        led.enable(false)
        // You can add more one-time setup here if needed.
    }

    // ===== Fixed mapping =====
    const SERVO_PIN: AnalogPin = AnalogPin.P2
    const NEO_PIN: DigitalPin = DigitalPin.P12
    const NEO_COUNT: number = 16   // change if your ring has different LED count
    const FAN_PIN: AnalogPin = AnalogPin.P7
    const DHT_PIN: DigitalPin = DigitalPin.P15
    const LED_PIN: DigitalPin = DigitalPin.P8
    const IR_PIN: DigitalPin = DigitalPin.P9
    const LDR_PIN: AnalogPin = AnalogPin.P1
    const ULTRA_TRIG: DigitalPin = DigitalPin.P13
    const ULTRA_ECHO: DigitalPin = DigitalPin.P14
    const BUZZER_PIN: AnalogPin = AnalogPin.P10
    const BUTTON_PIN: DigitalPin = DigitalPin.P3
    const TRIMPOT_PIN: AnalogPin = AnalogPin.P0
    const SWITCH_PIN: DigitalPin = DigitalPin.P4

    // ===== Optional: a visible "Initialize kit" block =====
    //% block="initialize Neo Inventor Kit"
    //% weight=110 blockGap=12
    export function init(): void {
        __ensureInit()
        OLED12864_I2C.init(60)             // 60=0x3C; use 61 for 0x3D panels
        OLED12864_I2C.clear()        
        pins.digitalWritePin(LED_PIN,0)
    }

    // ===== Servo =====
    //% block="set SERVO angle %angle°"
    //% angle.min=0 angle.max=180 angle.defl=90
    //% weight=100 blockGap=12
    export function setServoAngle(angle: number): void {
        __ensureInit()
        pins.servoWritePin(SERVO_PIN, Math.clamp(0, 180, angle))
    }

    // ===== NeoPixel =====
    let __ring: neopixel.Strip = null

    /**
     * Get the NeoPixel ring on the fixed pin.
     */
    //% block="Neo ring"
    //% weight=98 blockGap=8
    export function ring(): neopixel.Strip {
        __ensureInit()
        if (!__ring) __ring = neopixel.create(NEO_PIN, NEO_COUNT, NeoPixelMode.RGB)
        return __ring
    }

    // Helper: rainbow on the fixed ring
    //% block="ring rainbow"
    //% weight=97 blockGap=12
    export function ringRainbow(): void {
        __ensureInit()
        ring().showRainbow(1, 360)
    }

    // ===== Ultrasonic (HC-SR04 style) =====
    /**
     * Read ultrasonic distance in centimeters using fixed TRIG/ECHO pins.
     */
    //% block="ultrasonic distance (cm)"
    //% weight=96 blockGap=12
    export function ultrasonicCm(): number {
        __ensureInit()
        pins.setPull(ULTRA_TRIG, PinPullMode.PullNone)
        pins.digitalWritePin(ULTRA_TRIG, 0)
        control.waitMicros(2)
        pins.digitalWritePin(ULTRA_TRIG, 1)
        control.waitMicros(10)
        pins.digitalWritePin(ULTRA_TRIG, 0)
        const d = pins.pulseIn(ULTRA_ECHO, PulseValue.High, 25000) // timeout ~4m
        return Math.idiv(d, 58)
    }

    // ===== Fan (PWM) =====
    //% block="set FAN to %percent %%"
    //% percent.min=0 percent.max=100 percent.defl=100
    //% weight=94 blockGap=12
    export function setFan(percent: number): void {
        __ensureInit()
        const v = Math.clamp(0, 100, percent)
        pins.analogWritePin(FAN_PIN, Math.map(v, 0, 100, 0, 1023))
    }

    // ===== Buzzer (tone) =====
    //% block="BUZZER play %frequency Hz for %ms ms"
    //% frequency.min=50 frequency.max=4000 frequency.defl=880
    //% ms.min=1 ms.max=2000 ms.defl=500
    //% weight=92 blockGap=12
    export function buzzerTone(frequency: number, ms: number): void {
        __ensureInit()
        pins.analogSetPitchPin(BUZZER_PIN)
        music.playTone(frequency, ms)
    }

    // ===== LED =====
    //% block="LED %on=toggleOnOff"
    //% weight=90 blockGap=12
    export function setLed(on: boolean): void {
        __ensureInit()
        pins.digitalWritePin(LED_PIN, on ? 1 : 0)
    }
    // Helper shadow
    //% blockId=toggleOnOff block="%on"
    export function toggleOnOff(): boolean {
        return true
    }

    // ===== LDR =====
    //% block="LDR (0–1023)"
    //% weight=88 blockGap=12
    export function readLDR(): number {
        __ensureInit()
        return pins.analogReadPin(LDR_PIN)
    }

    // ===== Humidity  =====

        // --- DHT11 (no library) on fixed P15 ---
    // throttle: ≥1.1s between reads
    let __dhtLast = 0
    function __dhtEnsureInterval(): void {
        const since = input.runningTime() - __dhtLast
        const wait = 1100 - since
        if (wait > 0) basic.pause(wait)
        __dhtLast = input.runningTime()
    }

    /**
     * Read 5 raw bytes from DHT11 on P15.
     * Returns [humInt, humDec, tempInt, tempDec, checksum] or [-1,...] on error.
     */
    //% blockHidden=true
    export function __dht11ReadRawBytes(): number[] {
        __ensureInit()                 // your one-time init (LED off, etc.)
        __dhtEnsureInterval()

        let data = [0, 0, 0, 0, 0]

        // 1) Idle high (pull-up)
        pins.setPull(DHT_PIN, PinPullMode.PullUp)

        // 2) Start: drive LOW ≥18ms to wake DHT11
        pins.digitalWritePin(DHT_PIN, 0)
        basic.pause(18)

        // 3) Release HIGH for ~30µs while still output
        pins.digitalWritePin(DHT_PIN, 1)
        control.waitMicros(30)

        // 4) Switch to INPUT with pull-up so the sensor can drive the line
        pins.setPull(DHT_PIN, PinPullMode.PullUp)
        pins.digitalReadPin(DHT_PIN) // ensure input mode

        // 5) Sensor response: ~80µs LOW, then ~80µs HIGH
        if (pins.pulseIn(DHT_PIN, PulseValue.Low, 120000) == 0) return [-1,-1,-1,-1,-1]
        if (pins.pulseIn(DHT_PIN, PulseValue.High, 120000) == 0) return [-1,-1,-1,-1,-1]

        // 6) Read 40 bits: 50µs LOW + (≈26–28µs HIGH = 0) or (≈70µs HIGH = 1)
        for (let i = 0; i < 40; i++) {
            if (pins.pulseIn(DHT_PIN, PulseValue.Low, 120000) == 0) return [-1,-1,-1,-1,-1]
            const hi = pins.pulseIn(DHT_PIN, PulseValue.High, 120000)
            if (hi == 0) return [-1,-1,-1,-1,-1]
            const bit = hi > 45 ? 1 : 0   // ~45µs threshold works well on micro:bit
            const byteIndex = Math.idiv(i, 8)
            data[byteIndex] = (data[byteIndex] << 1) | bit
        }

        // 7) Checksum
        const sum = (data[0] + data[1] + data[2] + data[3]) & 0xFF
        if (sum != data[4]) return [-1,-1,-1,-1,-1]

        return data
    }

    // Convenience wrappers
    //% block="DHT11 temperature (°C)"
    export function dht11TemperatureC(): number {
        const d = __dht11ReadRawBytes()
        return d[0] < 0 ? -999 : (d[2] + d[3] / 10)
    }

    //% block="DHT11 humidity (%%)"
    export function dht11HumidityPercent(): number {
        const d = __dht11ReadRawBytes()
        return d[0] < 0 ? -999 : (d[0] + d[1] / 10)
    }

    // ===== Button (active-low) =====
    //% block="button pressed"
    //% weight=84 blockGap=12
    export function isButtonPressed(): boolean {
        __ensureInit()
        pins.setPull(BUTTON_PIN, PinPullMode.PullUp)
        return pins.digitalReadPin(BUTTON_PIN) == 0
    }

    // ===== On/Off Switch (active-low) =====
    //% block="switch on"
    //% weight=82 blockGap=12
    export function isSwitchOn(): boolean {
        __ensureInit()
        pins.setPull(SWITCH_PIN, PinPullMode.PullUp)
        return pins.digitalReadPin(SWITCH_PIN) == 0
    }

    // ===== Trimpot =====
    //% block="trimpot percent"
    //% weight=80 blockGap=12
    export function readTrimpotPercent(): number {
        __ensureInit()
        const v = pins.analogReadPin(TRIMPOT_PIN)
        return Math.map(v, 0, 1023, 0, 100)
    }

    // ===== IR (raw level only; use an IR extension for decoding) =====
    //% block="IR level"
    //% weight=70 blockGap=12
    export function irLevel(): number {
        __ensureInit()
        return pins.digitalReadPin(IR_PIN)
    }

    // ===== Legacy pin-parameter APIs (hidden) =====
    //% blockHidden=true
    export function setServoAngleOn(pin: AnalogPin, angle: number): void {
        pins.servoWritePin(pin, Math.clamp(0, 180, angle))
    }

    //% blockHidden=true
    export function ultrasonicCmOn(trig: DigitalPin, echo: DigitalPin): number {
        pins.setPull(trig, PinPullMode.PullNone)
        pins.digitalWritePin(trig, 0)
        control.waitMicros(2)
        pins.digitalWritePin(trig, 1)
        control.waitMicros(10)
        pins.digitalWritePin(trig, 0)
        const d = pins.pulseIn(echo, PulseValue.High, 25000)
        return Math.idiv(d, 58)
    }

    //% blockHidden=true
    export function setFanOnPin(pin: AnalogPin, percent: number): void {
        const v = Math.clamp(0, 100, percent)
        pins.analogWritePin(pin, Math.map(v, 0, 100, 0, 1023))
    }

    //% block="OLED clear"
    //% weight=78 blockGap=8
    export function oledClear(): void {
        __ensureInit()
        OLED12864_I2C.clear()
    }

    //% block="OLED show text %text at col %col row %row"
    //% col.min=0 col.max=23 row.min=0 row.max=7
    //% weight=76 blockGap=8
    export function oledShowText(text: string, col: number, row: number): void {
        __ensureInit()
        OLED12864_I2C.showString(col, row, text, 1)
    }

    //% block="OLED show number %value at col %col row %row"
    //% col.min=0 col.max=23 row.min=0 row.max=7
    //% weight=74 blockGap=8
    export function oledShowNumber(value: number, col: number, row: number): void {
        __ensureInit()
        OLED12864_I2C.showNumber(col, row, value, 1)
    }

    //% block="OLED set zoom %on" on.shadow=toggleOnOff
    //% weight=72 blockGap=8
    export function oledZoom(on: boolean): void {
        __ensureInit()
        OLED12864_I2C.zoom(on)
    }

    //% block="OLED invert %on" on.shadow=toggleOnOff
    //% weight=70 blockGap=8
    export function oledInvert(on: boolean): void {
        __ensureInit()
        OLED12864_I2C.invert(on)
    }

    //% block="OLED draw rect x1 %x1 y1 %y1 x2 %x2 y2 %y2"
    //% weight=68 blockGap=8
    export function oledRect(x1: number, y1: number, x2: number, y2: number): void {
        __ensureInit()
        OLED12864_I2C.rect(x1, y1, x2, y2, 1)
    }
}
