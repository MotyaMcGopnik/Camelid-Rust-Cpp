import { SUPPORTED_MODELS } from '../../lib/supportedModels'
import { formatBytes } from '../../lib/formatters'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { IconCheck, IconDownload, IconStop } from '../ui/icons'

/* "Supported models" — the curated rows Camelid can download + run, with a
   one-click Download wired to the existing catalog install + progress tracking. */
export function SupportedModels({
  models = [],
  runtime,
  installCatalogModel,
  cancelModelDownload,
  activateModel,
  loadingModelId = '',
}) {
  const online = runtime?.status === 'online'

  return (
    <section className="supported-models" aria-label="Supported models you can download">
      <header className="supported-models__head">
        <div>
          <p className="supported-models__kicker">Supported models</p>
          <h3 className="supported-models__title">Download a model Camelid can run</h3>
        </div>
        {!online && <Chip tone="warn" dot>Start the backend to download</Chip>}
      </header>

      <div className="supported-models__grid">
        {SUPPORTED_MODELS.map((item) => {
          const tracked = models.find((m) => m.id === item.catalog_id)
          const status = tracked?.status
          const downloading = status === 'downloading' || status === 'canceling'
          const progress = Math.max(0, Math.min(100, Number(tracked?.progress) || 0))
          const downloaded = Boolean(tracked) && !downloading && status !== 'failed'
          const loadedNow = Boolean(tracked?.loaded_now)
          const busy = loadingModelId === tracked?.id

          return (
            <article key={item.catalog_id} className={`supported-model ${item.recommended ? 'is-recommended' : ''}`}>
              <div className="supported-model__top">
                <h4 className="supported-model__name">{item.name}</h4>
                <div className="supported-model__tags">
                  <Chip tone="neutral">{item.quant}</Chip>
                  <Chip tone="neutral">{formatBytes(item.size_bytes)}</Chip>
                  {item.recommended && <Chip tone="accent">Recommended</Chip>}
                </div>
              </div>
              <p className="supported-model__blurb">{item.blurb}</p>

              {downloading ? (
                <div className="supported-model__progress-row">
                  <div className="supported-model__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <span className="supported-model__progress-label">{status === 'canceling' ? 'Canceling…' : `${progress}%`}</span>
                  <Button variant="ghost" size="sm" icon={<IconStop size={15} />} onClick={() => cancelModelDownload(tracked.id)} disabled={status === 'canceling'}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="supported-model__actions">
                  {loadedNow ? (
                    <Chip tone="ready" icon={<IconCheck size={15} />}>Loaded</Chip>
                  ) : downloaded ? (
                    <>
                      <Chip tone="ready" icon={<IconCheck size={15} />}>Downloaded</Chip>
                      <Button variant="primary" size="sm" loading={busy} onClick={() => activateModel(tracked.id)}>
                        Load
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<IconDownload size={16} />}
                      onClick={() => installCatalogModel(item)}
                      disabled={!online}
                      title={online ? `Download ${item.name}` : 'Start the Camelid backend first (Settings)'}
                    >
                      Download
                    </Button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default SupportedModels
