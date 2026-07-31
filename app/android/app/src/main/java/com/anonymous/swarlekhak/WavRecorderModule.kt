package com.anonymous.swarlekhak

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean

class WavRecorderModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var audioRecord: AudioRecord? = null
  private var recordingThread: Thread? = null
  private var outputPath: String? = null
  private var isRecording = AtomicBoolean(false)

  override fun getName(): String = "WavRecorder"

  @ReactMethod
  fun startRecording(path: String, promise: Promise) {
    try {
      stopRecordingInternal()
      val sampleRate = 16000
      val minBuffer = AudioRecord.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
      )
      val record = AudioRecord(
        MediaRecorder.AudioSource.MIC,
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
        minBuffer
      )
      if (record.state != AudioRecord.STATE_INITIALIZED) {
        record.release()
        promise.reject("E_RECORD", "AudioRecord initialization failed")
        return
      }
      outputPath = path
      isRecording.set(true)
      record.startRecording()
      audioRecord = record
      recordingThread = Thread {
        writeWav(record, path, sampleRate)
      }
      recordingThread?.start()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_RECORD", e.message)
    }
  }

  @ReactMethod
  fun stopRecording(promise: Promise) {
    try {
      val path = outputPath
      isRecording.set(false)
      audioRecord?.stop()
      recordingThread?.join()
      audioRecord?.release()
      audioRecord = null
      recordingThread = null
      promise.resolve(path)
    } catch (e: Exception) {
      promise.reject("E_STOP", e.message)
    }
  }

  private fun stopRecordingInternal() {
    if (!isRecording.get()) return
    isRecording.set(false)
    audioRecord?.stop()
    recordingThread?.join()
    audioRecord?.release()
    audioRecord = null
    recordingThread = null
  }

  private fun writeWav(record: AudioRecord, path: String, sampleRate: Int) {
    val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
    header.put("RIFF".toByteArray(Charsets.US_ASCII))
    header.putInt(0)
    header.put("WAVE".toByteArray(Charsets.US_ASCII))
    header.put("fmt ".toByteArray(Charsets.US_ASCII))
    header.putInt(16)
    header.putShort(1)
    header.putShort(1)
    header.putInt(sampleRate)
    header.putInt(sampleRate * 2)
    header.putShort(2)
    header.putShort(16)
    header.put("data".toByteArray(Charsets.US_ASCII))
    header.putInt(0)

    RandomAccessFile(path, "rw").use { raf ->
      raf.write(header.array())
      val dataStart = raf.filePointer
      val buf = ByteBuffer.allocate(record.bufferSizeInFrames * 2).order(ByteOrder.LITTLE_ENDIAN)
      val shorts = ShortArray(record.bufferSizeInFrames)

      while (isRecording.get()) {
        val n = record.read(shorts, 0, shorts.size)
        if (n <= 0) continue
        buf.clear()
        for (i in 0 until n) buf.putShort(shorts[i])
        raf.write(buf.array(), 0, n * 2)
      }

      val dataSize = raf.filePointer - dataStart
      raf.seek(4)
      raf.write(intToLE((dataSize + 36).toInt()))
      raf.seek(40)
      raf.write(intToLE(dataSize.toInt()))
    }
  }

  private fun intToLE(v: Int): ByteArray =
    ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(v).array()
}
