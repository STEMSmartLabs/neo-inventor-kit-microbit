
//% color=#FF8C00 icon="" block="Neo Inventor Kit" weight=90
namespace neoinventor {

    //% block="set SERVO at %pin to angle %angle°"
    //% angle.min=0 angle.max=180
    //% weight=100 blockGap=12
    export function setServoAngle(pin: AnalogPin, angle: number): void {
        pins.servoWritePin(pin, Math.max(0, Math.min(180, angle)))
    }

    /**
     * Create a NeoPixel strip on a pin with N LEDs.
     */
    //% block="create NeoPixel on %pin with %num LEDs"
    //% num.min=1 num.defl=16
    //% weight=98 blockGap=12
    export function createNeoPixel(pin: DigitalPin, num: number): neopixel.Strip {
        return neopixel.create(pin, num, NeoPixelMode.RGB)
    }

    /**
     * Read ultrasonic distance (HC-SR04 style) in centimeters
     */
    //% block="ultrasonic distance cm TRIG %trig ECHO %echo"
    //% weight=96 blockGap=12
    export function ultrasonicCm(trig: DigitalPin, echo: DigitalPin): number {
        pins.setPull(trig, PinPullMode.PullNone)
        pins.digitalWritePin(trig, 0)
        control.waitMicros(2)
        pins.digitalWritePin(trig, 1)
        control.waitMicros(10)
        pins.digitalWritePin(trig, 0)
        const d = pins.pulseIn(echo, PulseValue.High, 25000) // ~4m
        const cm = Math.idiv(d, 58)
        return cm
    }

    /**
     * Set DC fan speed percentage (0-100) using PWM
     */
    //% block="set FAN on %pin to %percent \%"
    //% percent.min=0 percent.max=100 percent.defl=100
    //% weight=94 blockGap=12
    export function setFan(pin: AnalogPin, percent: number): void {
        let v = Math.clamp(0, 100, percent)
        pins.analogWritePin(pin, Math.map(v, 0, 100, 0, 1023))
    }

    /**
     * Play a tone on a piezo/buzzer connected to a pin.
     */
    //% block="BUZZER on %pin play %frequency Hz for %ms ms"
    //% frequency.min=50 frequency.max=4000 frequency.defl=880
    //% ms.min=1 ms.max=2000 ms.defl=500
    //% weight=92 blockGap=12
    export function buzzerTone(pin: AnalogPin, frequency: number, ms: number): void {
        pins.analogSetPitchPin(pin)
        music.playTone(frequency, ms)
    }

    /**
     * Simple LED on/off
     */
    //% block="set LED on %pin to %on"
    //% weight=90 blockGap=12
    export function setLed(pin: DigitalPin, on: boolean): void {
        pins.digitalWritePin(pin, on ? 1 : 0)
    }

    /**
     * Read LDR (light) level (0..1023)
     */
    //% block="read LDR on %pin"
    //% weight=88 blockGap=12
    export function readLDR(pin: AnalogPin): number {
        return pins.analogReadPin(pin)
    }

    /**
     * Read external switch (active low recommended with INPUT_PULLUP)
     */
    //% block="read SWITCH on %pin"
    //% weight=86 blockGap=12
    export function readSwitch(pin: DigitalPin): boolean {
        pins.setPull(pin, PinPullMode.PullUp)
        return pins.digitalReadPin(pin) == 0
    }

    /**
     * Read trimpot/knob as 0..100%
     */
    //% block="read TRIMPOT on %pin as percent"
    //% weight=84 blockGap=12
    export function readTrimpotPercent(pin: AnalogPin): number {
        const v = pins.analogReadPin(pin) // 0..1023
        return Math.map(v, 0, 1023, 0, 100)
    }
}
