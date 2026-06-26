package com.takip.app.collector

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.camera2.*
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.util.Size
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Semaphore
import java.util.concurrent.TimeUnit

object CameraCaptureHelper {

    fun capturePhoto(context: Context, useFrontCamera: Boolean): File? {
        val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val cameraId = manager.cameraIdList.firstOrNull { id ->
            val facing = manager.getCameraCharacteristics(id).get(CameraCharacteristics.LENS_FACING)
            if (useFrontCamera) facing == CameraCharacteristics.LENS_FACING_FRONT
            else facing == CameraCharacteristics.LENS_FACING_BACK
        } ?: return null

        val outputFile = File(context.cacheDir, "cam_${System.currentTimeMillis()}.jpg")
        val semaphore = Semaphore(0)
        var result: File? = null

        val thread = HandlerThread("CameraCapture").apply { start() }
        val handler = Handler(thread.looper)

        try {
            val reader = ImageReader.newInstance(640, 480, ImageFormat.JPEG, 1)
            reader.setOnImageAvailableListener({ imgReader ->
                val image = imgReader.acquireLatestImage() ?: return@setOnImageAvailableListener
                val buffer = image.planes[0].buffer
                val bytes = ByteArray(buffer.remaining())
                buffer.get(bytes)
                image.close()
                FileOutputStream(outputFile).use { it.write(bytes) }
                result = outputFile
                semaphore.release()
            }, handler)

            manager.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    val surface = reader.surface
                    val requestBuilder = camera.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE).apply {
                        addTarget(surface)
                    }
                    camera.createCaptureSession(listOf(surface), object : CameraCaptureSession.StateCallback() {
                        override fun onConfigured(session: CameraCaptureSession) {
                            session.capture(requestBuilder.build(), null, handler)
                            session.close()
                            camera.close()
                        }
                        override fun onConfigureFailed(session: CameraCaptureSession) {
                            camera.close()
                            semaphore.release()
                        }
                    }, handler)
                }
                override fun onDisconnected(camera: CameraDevice) { camera.close(); semaphore.release() }
                override fun onError(camera: CameraDevice, error: Int) { camera.close(); semaphore.release() }
            }, handler)

            semaphore.tryAcquire(8, TimeUnit.SECONDS)
        } catch (_: Exception) {
            return null
        } finally {
            thread.quitSafely()
        }
        return result
    }
}
