package com.takip.app.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.takip.app.databinding.ActivityPinLockBinding
import com.takip.app.util.PrefsManager

class PinLockActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPinLockBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPinLockBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val target = intent.getStringExtra(EXTRA_TARGET) ?: TARGET_SETTINGS

        binding.pinButton.setOnClickListener {
            val entered = binding.pinInput.text?.toString()?.trim() ?: ""
            val expected = PrefsManager.menuPin
            if (entered == expected) {
                when (target) {
                    TARGET_SETTINGS -> startActivity(Intent(this, HiddenSettingsActivity::class.java))
                }
                finish()
            } else {
                binding.pinError.text = getString(com.takip.app.R.string.pin_wrong)
                binding.pinError.visibility = View.VISIBLE
            }
        }
    }

    companion object {
        const val EXTRA_TARGET = "target"
        const val TARGET_SETTINGS = "settings"
    }
}
