/**
 * @package MoonlightTS
 * @author tamilpp25
 * @license GPL-3.0
 */
import Logger from './utils/Logger';
import HttpServer from './http/HttpServer';
import Interface from './commands/Interface';
import { SystemExecutor } from './system';
import { KcpServer } from './kcp';
import { ExcelManager } from './game/managers/ExcelManager';
import ProtoFactory from './utils/ProtoFactory';
import { FightProperty } from './game/managers/constants/FightProperties';
import { ConfigManager } from './game/managers/ConfigManager';
import { EntityProperty } from './game/managers/constants/EntityProperties';
import { RSAUtils } from './crypto';

const c = new Logger('MoonlightTS');
c.log('Starting MoonlightTS...');

RSAUtils.initKeys();
ConfigManager.init();

HttpServer.getInstance().start();
ProtoFactory.init();
Interface.start();

// Data stuff
FightProperty.init();
EntityProperty.init();
ExcelManager.init();

new SystemExecutor().register(new KcpServer()).start(100);
