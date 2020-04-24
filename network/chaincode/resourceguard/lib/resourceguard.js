/*
 * SPDX-License-Identifier: Apache-2.0
 */

// Fabric chaincode class
const { Contract } = require('fabric-contract-api');


/*
 * resourceguard
*/
class resourceguard extends Contract {

  /**
   * Add resource hash
   *
   * @param {Context} ctx the transaction context
   * @param {String} resTreeHash hash value of full resource tree
   * @param {String} resHash hash value of the resource
  */
  async addResourceHash(ctx, resTreeHash, resHash) {

    const stateData = {
      resHash,
      resTreeHash,
      docType: 'resource'
    };

    await ctx.stub.putState(rTreeHash,Buffer.from(JSON.stringify(stateData)));

    }

  /**
   * Add resource tree hash
   *
   * @param {Context} ctx the transaction context
   * @param {String} clockTick clock tick value
   * @param {String} resMClockHash hash of all mtimes in a specific location
   * @param {String} resTreeHash hash of the entire resource tree structure
  */
  async addResourceTreeHash(ctx, clockTick, resMClockHash, resTreeHash) {

    const stateData = {
      clockTick,
      resMClockHash,
      resTreeHash,
      docType: 'resource-clockhash'
    };

    await ctx.stub.putState(clockTick,Buffer.from(JSON.stringify(stateData)));
  }

  /**
   * Lookup specific resource  hash
   *
   * @param {Context} ctx the transaction context
   * @param {String} resTreeHash hash of the entire resource tree structure
  */
  async getResourceHash(ctx, resTreeHash) {

    const stateData = await ctx.stub.getState(resTreeHash);

    if (!stateData || stateData.length === 0) {
      throw new Error(`Requested resource hash not found. ${resTreeHash}`);
    }

    return stateData.toString();
  }

  /**
   * Lookup Resource Tree Hash
   *
   * @param {Context} ctx the transaction context
   * @param {String} clockTick clock tick value of res
  */
  async getResourceTreeHash(ctx, clockTick) {

    const stateData = await ctx.stub.getState(clockTick);

    if (!stateData || stateData.length === 0) {
        throw new Error(`Requested resource tree hash not found. ${clockTick}`);
    }

    return stateData.toString();
  }

}

module.exports = resourceguard;
