import { GetPlayerTokenReq, GetPlayerTokenRsp, WindSeedClientNotify, WindSeedClientNotify_AreaNotify } from '../../../data/proto/game';
import { Session } from '../../session';
import { DataPacket } from '../../packet';
import ProtoFactory from '../../../utils/ProtoFactory';
import Account from '../../../db/Account';
import { RSAUtils } from '../../../crypto';

export default async function handle(session: Session, packet: DataPacket) {

  const body = ProtoFactory.getBody(packet) as GetPlayerTokenReq;
  session.c.debug(GetPlayerTokenReq.toJSON(body))

  const account = await Account.fromToken(body.accountToken);

  const seed = 0x0n; //create a random seed

  const encrypted_client_seed = Buffer.from(body.clientRandKey, 'base64'); //Get encrypted seed from client
  const decrypted_client_seed = RSAUtils.rsaDecrypt(
    RSAUtils.keys.get("Sign")!,
    encrypted_client_seed
  ); //Decrypt it with signingKey

  const seedBuf = Buffer.alloc(8);
  seedBuf.writeBigUInt64BE(seed ^ decrypted_client_seed.readBigUInt64BE()); //xor seed with client seed

  const encryptedSeed = RSAUtils
    .rsaEncrypt(RSAUtils.keys.get(body.keyId.toString())!, seedBuf)
    .toString('base64'); //encrypt again with public key
  const seedSignature = RSAUtils
    .rsaSign(RSAUtils.keys.get("Sign")!, seedBuf)
    .toString('base64'); // sign with signing key

  const dataObj: GetPlayerTokenRsp = GetPlayerTokenRsp.fromPartial({
    retcode: 0,
    uid: account?.uid,
    token: account?.token,
    accountType: body.accountType,
    accountUid: body.accountUid,
    channelId: body.channelId,
    serverRandKey: encryptedSeed,
    sign: seedSignature,
  });

  session.send(GetPlayerTokenRsp, dataObj);

  session.uid = account!.uid

  session.connection.encryptor.seed(seed);
}
