/**
 * @template {Record<string, unknown>} [T=Record<string, unknown>]
 * @extends {Model<T, ModelSetOptions, any>}
 */
export class FireModel<T extends Record<string, unknown> = Record<string, unknown>> extends Model<T, ModelSetOptions, any> {
    constructor(attributes?: Partial<T>, options?: any);
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * @returns {CollectionReference | undefined}
     */
    refRoot(): CollectionReference | undefined;
    /**
     * @returns {DocumentReference | CollectionReference | undefined}
     */
    ref(): DocumentReference | CollectionReference | undefined;
    /**
     * @param {string} method
     * @param {*} options
     * @returns
     */
    sync(method: string, options: any): Promise<any>;
}
import { Model } from 'nextbone';
//# sourceMappingURL=model.d.ts.map