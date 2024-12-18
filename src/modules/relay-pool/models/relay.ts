import { model } from '@medusajs/framework/utils';

const Relay = model.define("relay", {
    id: model.id().primaryKey(),
    url: model.text(),
})

export default Relay;
