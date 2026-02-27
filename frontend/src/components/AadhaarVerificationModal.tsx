import { useEffect, useState } from 'react'
import { X, Copy } from 'lucide-react'

type AadhaarVerificationModalProps = {
  isOpen: boolean
  aadhaarNumber: string
  aadhaarDocumentUrl?: string
  authToken?: string
  onClose: () => void
  onMarkVerified: () => void
}

export function AadhaarVerificationModal({
  isOpen,
  aadhaarNumber,
  aadhaarDocumentUrl,
  authToken,
  onClose,
  onMarkVerified,
}: AadhaarVerificationModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      if (!isOpen) {
        setPreviewUrl(null)
        return
      }

      if (!aadhaarDocumentUrl || !authToken) {
        setPreviewUrl(null)
        return
      }

      setIsLoadingPreview(true)
      try {
        const res = await fetch(aadhaarDocumentUrl, {
          headers: { Authorization: `Bearer ${authToken}` },
        })

        if (!res.ok) {
          throw new Error('Failed to load document preview')
        }

        const blob = await res.blob()
        if (cancelled) return

        const objectUrl = URL.createObjectURL(blob)
        setPreviewUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current)
          }
          return objectUrl
        })
      } catch {
        if (!cancelled) {
          setPreviewUrl(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }
        return null
      })
    }
  }, [isOpen, aadhaarDocumentUrl, authToken])

  if (!isOpen) return null

  const handleCopy = () => {
    if (!aadhaarNumber) return
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      void navigator.clipboard.writeText(aadhaarNumber).catch(() => {
        // ignore copy failures silently for now
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-4xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Verify Aadhaar Details
          </h2>
          <button
            type="button"
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Left column – Evidence */}
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Aadhaar Number
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-2xl font-bold tracking-widest text-gray-900">
                {aadhaarNumber || 'N/A'}
              </p>
              <button
                type="button"
                className="ml-3 p-2 rounded-md hover:bg-gray-100 text-gray-500"
                onClick={handleCopy}
                aria-label="Copy Aadhaar number"
              >
                <Copy size={18} />
              </button>
            </div>

            <div className="mt-6 aspect-video bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
              {isLoadingPreview ? (
                <span className="text-gray-400 text-sm">Loading Aadhaar document...</span>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aadhaar document"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-sm">
                  Aadhaar document preview will appear here
                </span>
              )}
            </div>
          </div>

          {/* Right column – Guide & Action */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Guide
            </h3>
            <ol className="list-decimal list-inside space-y-4 text-sm text-gray-700">
              <li>Copy the Aadhaar number from the left pane.</li>
              <li>Click the &quot;Open UIDAI Portal&quot; button below.</li>
              <li>Paste the number and complete the Captcha.</li>
              <li>Verify the Age Band, Gender, and State match the profile.</li>
            </ol>

            <div className="mt-8">
              <a
                href="https://myaadhaar.uidai.gov.in/verifyAadhaar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium"
              >
                Open UIDAI Portal ↗
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg"
            onClick={() => {
              onMarkVerified()
              onClose()
            }}
          >
            Mark as Verified
          </button>
        </div>
      </div>
    </div>
  )
}

