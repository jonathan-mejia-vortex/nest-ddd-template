/**
 * Puerto (interfaz) para el cliente de mensajería SQS
 * Ubicado en infraestructura para evitar acoplar el dominio a AWS
 */
export interface ISqsClient<TMessage = unknown> {
	/**
	 * Envía un mensaje a una cola SQS
	 * @param queueName Nombre de la cola
	 * @param message Contenido del mensaje
	 * @param attributes Atributos adicionales del mensaje
	 * @returns ID del mensaje enviado
	 */
	sendMessage(
		queueName: string,
		message: TMessage,
		attributes?: Record<string, string>
	): Promise<string>;

	/**
	 * Envía un batch de mensajes a una cola SQS
	 * @param queueName Nombre de la cola
	 * @param messages Array de mensajes
	 * @returns IDs de los mensajes enviados
	 */
	sendBatch(queueName: string, messages: TMessage[]): Promise<string[]>;
}

export const SQS_CLIENT = Symbol("SQS_CLIENT");
