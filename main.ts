
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

//% color=#0B5394 icon="\uf135" block="Neo Inventor Kit" weight=90
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
    const NEO_COUNT: number = 8   // change if your ring has different LED count
    const FAN_PIN: AnalogPin = AnalogPin.P7
    const LED_PIN: DigitalPin = DigitalPin.P8
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
        pins.digitalWritePin(LED_PIN, 0)
        connectIrReceiver(IrProtocol.NEC)
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
