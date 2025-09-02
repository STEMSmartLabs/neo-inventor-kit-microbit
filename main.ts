
// Neo Inventor Kit — fixed pin mapping for peripherals
// Pins (per your board):
// P2: Servo
// P12: NeoPixel ring
// P7: Fan (PWM)
// P15: Humidity (analog)  — if you use DHT11/22, prefer a DHT extension instead
// P8: LED
// P9: IR receiver (raw level only here)
// P1: LDR (analog)
// Trig P13, Echo P14: Ultrasonic
// P10: Buzzer (tone)
// P3: Button (active-low w/ pull-up)
// P0: Trimpot (analog)
// P4: On/Off switch (active-low w/ pull-up)

//% color=#FF8C00 icon="\uf135" block="Neo Inventor Kit" weight=90
namespace neoinventor {
    // ===== Fixed mapping =====
    const SERVO_PIN: AnalogPin = AnalogPin.P2
    const NEO_PIN: DigitalPin = DigitalPin.P12
    const NEO_COUNT: number = 16   // change if your ring has different LED count
    const FAN_PIN: AnalogPin = AnalogPin.P7
    const HUMIDITY_PIN: AnalogPin = AnalogPin.P15
    const LED_PIN: DigitalPin = DigitalPin.P8
    const IR_PIN: DigitalPin = DigitalPin.P9
    const LDR_PIN: AnalogPin = AnalogPin.P1
    const ULTRA_TRIG: DigitalPin = DigitalPin.P13
    const ULTRA_ECHO: DigitalPin = DigitalPin.P14
    const BUZZER_PIN: AnalogPin = AnalogPin.P10
    const BUTTON_PIN: DigitalPin = DigitalPin.P3
    const TRIMPOT_PIN: AnalogPin = AnalogPin.P0
    const SWITCH_PIN: DigitalPin = DigitalPin.P4

    // Optional: advanced overrides (hidden in toolbox)
    //% blockHidden=true
    export function __overrideNeoCount(n: number) { (n>0) && (neoCount = n) }
    //% blockHidden=true
    export function __overrideNeoPin(p: DigitalPin) { neoPin = p }
    //% blockHidden=true
    export function __overrideFanPin(p: AnalogPin) { fanPin = p }

    // Use mutable backing fields to allow advanced overrides
    let neoPin = NEO_PIN
    let neoCount = NEO_COUNT
    let fanPin = FAN_PIN

    // ===== Servo =====
    //% block="set SERVO angle %angle°"
    //% angle.min=0 angle.max=180 angle.defl=90
    //% weight=100 blockGap=12
    export function setServoAngle(angle: number): void {
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
        if (!__ring) __ring = neopixel.create(neoPin, neoCount, NeoPixelMode.RGB)
        return __ring
    }

    // Helper: rainbow on the fixed ring
    //% block="ring rainbow"
    //% weight=97 blockGap=12
    export function ringRainbow(): void {
        ring().showRainbow(1, 360)
    }

    // ===== Ultrasonic (HC-SR04 style) =====
    /**
     * Read ultrasonic distance in centimeters using fixed TRIG/ECHO pins.
     */
    //% block="ultrasonic distance (cm)"
    //% weight=96 blockGap=12
    export function ultrasonicCm(): number {
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
        const v = Math.clamp(0, 100, percent)
        pins.analogWritePin(fanPin, Math.map(v, 0, 100, 0, 1023))
    }

    // ===== Buzzer (tone) =====
    //% block="BUZZER play %frequency Hz for %ms ms"
    //% frequency.min=50 frequency.max=4000 frequency.defl=880
    //% ms.min=1 ms.max=2000 ms.defl=500
    //% weight=92 blockGap=12
    export function buzzerTone(frequency: number, ms: number): void {
        pins.analogSetPitchPin(BUZZER_PIN)
        music.playTone(frequency, ms)
    }

    // ===== LED =====
    //% block="LED %on=toggleOnOff"
    //% weight=90 blockGap=12
    export function setLed(on: boolean): void {
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
        return pins.analogReadPin(LDR_PIN)
    }

    // ===== Humidity (analog) =====
    /**
     * Read humidity sensor on P15 as 0–100% (mapped from analog 0–1023).
     * If you use a DHT11/22 module, prefer a dedicated DHT extension.
     */
    //% block="humidity percent"
    //% weight=86 blockGap=12
    export function readHumidityPercent(): number {
        const v = pins.analogReadPin(HUMIDITY_PIN) // 0..1023
        return Math.clamp(0, 100, Math.map(v, 0, 1023, 0, 100))
    }

    // ===== Button (active-low) =====
    //% block="button pressed"
    //% weight=84 blockGap=12
    export function isButtonPressed(): boolean {
        pins.setPull(BUTTON_PIN, PinPullMode.PullUp)
        return pins.digitalReadPin(BUTTON_PIN) == 0
    }

    // ===== On/Off Switch (active-low) =====
    //% block="switch on"
    //% weight=82 blockGap=12
    export function isSwitchOn(): boolean {
        pins.setPull(SWITCH_PIN, PinPullMode.PullUp)
        return pins.digitalReadPin(SWITCH_PIN) == 0
    }

    // ===== Trimpot =====
    //% block="trimpot percent"
    //% weight=80 blockGap=12
    export function readTrimpotPercent(): number {
        const v = pins.analogReadPin(TRIMPOT_PIN)
        return Math.map(v, 0, 1023, 0, 100)
    }

    // ===== IR (raw level only; use an IR extension for decoding) =====
    //% block="IR level"
    //% weight=70 blockGap=12
    export function irLevel(): number {
        return pins.digitalReadPin(IR_PIN)
    }

    // ===== Legacy pin-parameter APIs (hidden) =====
    // Keeping these allows old projects to compile if they used the earlier API.
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
}
