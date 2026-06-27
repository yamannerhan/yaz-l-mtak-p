package com.takip.app.collector

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.hardware.camera2.*
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import androidx.core.content.ContextCompat
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

object CameraCaptureHelper {
    private const val TAG = "CameraCapture"

    fun capturePhoto(context: Context, useFrontCamera: Boolean): File? {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(TAG, "Kamera izni yok")
            return null
        }

        val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val cameraId = manager.cameraIdList.firstOrNull { id ->
            val facing = manager.getCameraCharacteristics(id)
                .get(CameraCharacteristics.LENS_FACING)
            if (useFrontCamera) facing == CameraCharacteristics.LENS_FACING_FRONT
            else facing == CameraCharacteristics.LENS_FACING_BACK
        }
        if (cameraId == null) {
            Log.e(TAG, "Kamera bulunamadı front=$useFrontCamera")
            return null
        }

        val outputFile = File(context.cacheDir, "cam_${System.currentTimeMillis()}.jpg")
        val imageLatch = CountDownLatch(1)
        var saved = false

        val thread = HandlerThread("CameraCapture").apply { start() }
        val handler = Handler(thread.looper)
        var cameraDevice: CameraDevice? = null
        var captureSession: CameraCaptureSession? = null
        var imageReader: ImageReader? = null

        try {
            imageReader = ImageReader.newInstance(1280, 720, ImageFormat.JPEG, 2)
            imageReader.setOnImageAvailableListener({ reader ->
                try {
                    val image = reader.acquireLatestImage()
                    if (image != null) {
                        val buffer = image.planes[0].buffer
                        val bytes = ByteArray(buffer.remaining())
                        buffer.get(bytes)
                        image.close()
                        if (bytes.size > 500) {
                            FileOutputStream(outputFile).use { it.write(bytes) }
                            saved = true
                            Log.d(TAG, "Fotoğraf kaydedildi: ${bytes.size} byte")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Görüntü kaydetme hatası", e)
                } finally {
                    imageLatch.countDown()
                }
            }, handler)

            val openLatch = CountDownLatch(1)
            var openError = false
            manager.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    cameraDevice = camera
                    openLatch.countDown()
                }
                override fun onDisconnected(camera: CameraDevice) {
                    camera.close()
                    openError = true
                    openLatch.countDown()
                }
                override fun onError(camera: CameraDevice, error: Int) {
                    Log.e(TAG, "Kamera hatası: $error")
                    camera.close()
                    openError = true
                    openLatch.countDown()
                }
            }, handler)

            if (!openLatch.await(12, TimeUnit.SECONDS) || openError) return null
            val camera = cameraDevice ?: return null

            val sessionLatch = CountDownLatch(1)
            var sessionFailed = false
            camera.createCaptureSession(
                listOf(imageReader.surface),
                object : CameraCaptureSession.StateCallback() {
                    override fun onConfigured(session: CameraCaptureSession) {
                        captureSession = session
                        sessionLatch.countDown()
                    }
                    override fun onConfigureFailed(session: CameraCaptureSession) {
                        sessionFailed = true
                        sessionLatch.countDown()
                    }
                },
                handler
            )

            if (!sessionLatch.await(12, TimeUnit.SECONDS) || sessionFailed) return null
            val session = captureSession ?: return null

            val request = camera.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE).apply {
                addTarget(imageReader.surface)
                set(CaptureRequest.JPEG_QUALITY, 90.toByte())
                set(
                    CaptureRequest.CONTROL_AF_MODE,
                    CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE
                )
            }.build()

            session.capture(
                request,
                object : CameraCaptureSession.CaptureCallback() {
                    override fun onCaptureFailed(
                        session: CameraCaptureSession,
                        request: CaptureRequest,
                        failure: CaptureFailure
                    ) {
                        Log.e(TAG, "Capture failed: ${failure.reason}")
                        imageLatch.countDown()
                    }
                },
                handler
            )

            imageLatch.await(15, TimeUnit.SECONDS)
        } catch (e: Exception) {
            Log.e(TAG, "Kamera exception", e)
            return null
        } finally {
            try {
                captureSession?.close()
                cameraDevice?.close()
                imageReader?.close()
            } catch (_: Exception) {
            }
            thread.quitSafely()
        }

        return if (saved && outputFile.exists()) outputFile else null
    }
}
