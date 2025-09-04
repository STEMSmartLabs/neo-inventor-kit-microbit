// dht11.ts — DHT11 (no external library), fixed to P15
// Adds DHT11 temperature/humidity blocks under the "Neo Inventor Kit" category
// by using the same `namespace neoinventor` as your main.ts.

namespace neoinventor {
    // Fixed data pin for your kit
    const DHT_PIN: DigitalPin = DigitalPin.P15

    // Throttle reads: DHT11 requires ≥1s between queries
    let __dhtLast = 0
    function __dhtEnsureInterval(): void {
        const since = input.runningTime() - __dhtLast
        const wait = 1100 - since
        if (wait > 0) basic.pause(wait)
        __dhtLast = input.runningTime()
    }

    /**
     * Low-level DHT11 read: returns 5 raw bytes or [-1,...] on error.
     * Order: [humInt, humDec, tempInt, tempDec, checksum]
     */
    //% blockHidden=true
    export function __dht11ReadRawBytes(): number[] {
        __dhtEnsureInterval()

        const pin = DHT_PIN
        let data = [0, 0, 0, 0, 0]

        // 1) Idle high via pull-up
        pins.setPull(pin, PinPullMode.PullUp)

        // 2) Start signal: drive LOW ≥18ms to wake DHT11
        pins.digitalWritePin(pin, 0)
        basic.pause(20)

        // 3) Release HIGH for ~30µs while still output
        pins.digitalWritePin(pin, 1)
        control.waitMicros(30)

        // 4) Switch to INPUT so sensor can drive the line
        pins.setPull(pin, PinPullMode.PullUp)
        pins.digitalReadPin(pin) // ensure input mode

        // 5) Sensor response: ~80µs LOW, then ~80µs HIGH
        if (pins.pulseIn(pin, PulseValue.Low, 150000) == 0) return [-1,-1,-1,-1,-1]
        if (pins.pulseIn(pin, PulseValue.High, 150000) == 0) return [-1,-1,-1,-1,-1]

        // 6) Read 40 bits: 50µs LOW + (≈26–28µs HIGH = 0) or (≈70µs HIGH = 1)
        for (let i = 0; i < 40; i++) {
            if (pins.pulseIn(pin, PulseValue.Low, 150000) == 0) return [-1,-1,-1,-1,-1]
            const hi = pins.pulseIn(pin, PulseValue.High, 150000)
            if (hi == 0) return [-1,-1,-1,-1,-1]
            const bit = hi > 48 ? 1 : 0 // ~48µs threshold works well on micro:bit
            const byteIndex = Math.idiv(i, 8)
            data[byteIndex] = (data[byteIndex] << 1) | bit
        }

        // 7) Verify checksum (sum of first 4 bytes, LSB)
        const sum = (data[0] + data[1] + data[2] + data[3]) & 0xFF
        if (sum != data[4]) return [-1,-1,-1,-1,-1]

        return data
    }

    // ========== Friendly blocks ==========

    //% block="DHT11 temperature (°C)"
    //% weight=77 blockGap=8
    export function dht11TemperatureC(): number {
        const d = __dht11ReadRawBytes()
        return d[0] < 0 ? -999 : (d[2] + d[3] / 10)
    }

    //% block="DHT11 humidity (%%)"
    //% weight=75 blockGap=12
    export function dht11HumidityPercent(): number {
        const d = __dht11ReadRawBytes()
        return d[0] < 0 ? -999 : (d[0] + d[1] / 10)
    }

    export enum Dht11Part {
        //% block="humidity integer"
        HumidityInteger = 0,
        //% block="humidity decimal"
        HumidityDecimal = 1,
        //% block="temperature integer"
        TemperatureInteger = 2,
        //% block="temperature decimal"
        TemperatureDecimal = 3,
        //% block="checksum"
        Checksum = 4
    }

    //% block="DHT11 raw %part"
    //% weight=73 blockGap=8
    export function dht11Raw(part: Dht11Part): number {
        const d = __dht11ReadRawBytes()
        return d[0] < 0 ? -1 : d[part]
    }
}
