/**
 * Configuración de OpenTelemetry para AWS X-Ray
 *
 * Este archivo debe ser importado ANTES que cualquier otro código de la aplicación
 * para asegurar que la instrumentación automática funcione correctamente.
 *
 * En main.ts, agregar al inicio:
 * import './tracing';
 *
 * Configuración:
 * - Auto-instrumentación para NestJS, HTTP, Prisma, Redis, etc
 * - Exportación de trazas a AWS X-Ray
 * - Propagación de context con AWS X-Ray format
 * - ID Generator compatible con X-Ray
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { envs } from './config/envs';

// Solo inicializar en producción o si está explícitamente habilitado
const isTracingEnabled =
  envs.nodeEnv === 'production' || process.env.OTEL_ENABLED === 'true';

if (isTracingEnabled) {
  const sdk = new NodeSDK({
    // Exporter para AWS X-Ray (via ADOT Collector)
    // El ADOT Collector debe estar corriendo y configurado para enviar a X-Ray
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        'http://localhost:4318/v1/traces',
      headers: {},
    }),

    // ID Generator compatible con AWS X-Ray
    idGenerator: new AWSXRayIdGenerator(),

    // Propagador para X-Ray context
    textMapPropagator: new AWSXRayPropagator(),

    // Auto-instrumentación
    instrumentations: [
      getNodeAutoInstrumentations({
        // Configuración específica por instrumentación
        '@opentelemetry/instrumentation-http': {
          // Ignorar health checks
          ignoreIncomingRequestHook: (request) => {
            const url = request.url || '';
            return url.includes('/health') || url.includes('/metrics');
          },
        },
        '@opentelemetry/instrumentation-nestjs-core': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
          // Capturar queries de Prisma (que usa pg internamente)
        },
        '@opentelemetry/instrumentation-ioredis': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        // Deshabilitar instrumentaciones no necesarias
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
      }),
    ],
  });

  // Iniciar SDK
  sdk.start();

  // Shutdown gracefully en señales de terminación
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  console.log('OpenTelemetry configured for AWS X-Ray');
} else {
  console.log('OpenTelemetry disabled (set OTEL_ENABLED=true to enable)');
}
