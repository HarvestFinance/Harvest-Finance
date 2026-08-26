"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TunnelMutation", {
    enumerable: true,
    get: function() {
        return TunnelMutation;
    }
});
const _client = require("../client");
const CreateSignedTunnelUrlDocument = (0, _client.graphql)(`
  mutation CreateSignedTunnelUrl($accountId: ID!) {
    tunnels {
      createSignedTunnelUrl(accountId: $accountId) {
        label
        url
      }
    }
  }
`);
const TunnelMutation = {
    async createSignedTunnelUrlAsync (accountId) {
        const data = await (0, _client.mutate)(CreateSignedTunnelUrlDocument, {
            accountId
        });
        return data.tunnels.createSignedTunnelUrl;
    }
};

//# sourceMappingURL=TunnelMutation.js.map