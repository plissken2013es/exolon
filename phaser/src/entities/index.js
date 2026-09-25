import VitorcEntity from "./VitorcEntity.js";
import TurretEntity from "./TurretEntity.js";
import CocoonEntity from "./CocoonEntity.js";
import RadarEntity from "./RadarEntity.js";
import RocketEntity from "./RocketEntity.js";
import ShipFireEntity from "./ShipFireEntity.js";
import LightEntity from "./LightEntity.js";
import GrenadePackEntity from "./GrenadePackEntity.js";
import AmmoPackEntity from "./AmmoPackEntity.js";
import TeleportEntity from "./TeleportEntity.js";
import PistonEntity from "./PistonEntity.js";
import BubbleCreatorEntity from "./BubbleCreatorEntity.js";
import IncubatorEntity from "./IncubatorEntity.js";
import EggEntity from "./EggEntity.js";
import DoubleLauncherEntity from "./DoubleLauncherEntity.js";
import MineEntity from "./MineEntity.js";
import MissileGuidanceEntity from "./MissileGuidanceEntity.js";
import InterceptorCreatorEntity from "./InterceptorCreatorEntity.js";
import JellyfishCreatorEntity from "./JellyfishCreatorEntity.js";
import WaggonEntity from "./WaggonEntity.js";
import CombinedLauncherTopEntity from "./CombinedLauncherTopEntity.js";
import CombinedLauncherBottomEntity from "./CombinedLauncherBottomEntity.js";
import SquareLightEntity from "./SquareLightEntity.js";
import DischargeEntity from "./DischargeEntity.js";
import ExitEntity from "./ExitEntity.js";
import FungusEntity from "./FungusEntity.js";
import LouseCreatorEntity from "./LouseCreatorEntity.js";
import CapsuleEntity from "./CapsuleEntity.js";
import BeamEntity from "./BeamEntity.js";
import FlasherCreatorEntity from "./FlasherCreatorEntity.js";
import FirCreatorEntity from "./FirCreatorEntity.js";

/**
 * Entity classes by the name of their objects in the maps.
 */
const entities = {
  vitorc: VitorcEntity,
  turret: TurretEntity,
  cocoon: CocoonEntity,
  radar: RadarEntity,
  rocket: RocketEntity,
  ship_fire: ShipFireEntity,
  light: LightEntity,
  grenade_pack: GrenadePackEntity,
  ammo_pack: AmmoPackEntity,
  teleport: TeleportEntity,
  piston: PistonEntity,
  bubble_creator: BubbleCreatorEntity,
  incubator: IncubatorEntity,
  egg: EggEntity,
  double_launcher: DoubleLauncherEntity,
  mine: MineEntity,
  missile_guidance: MissileGuidanceEntity,
  interceptor_creator: InterceptorCreatorEntity,
  jellyfish_creator: JellyfishCreatorEntity,
  waggon: WaggonEntity,
  combined_launcher_top: CombinedLauncherTopEntity,
  combined_launcher_bottom: CombinedLauncherBottomEntity,
  square_light: SquareLightEntity,
  discharge: DischargeEntity,
  exit: ExitEntity,
  fungus: FungusEntity,
  louse_creator: LouseCreatorEntity,
  capsule: CapsuleEntity,
  beam: BeamEntity,
  flasher_creator: FlasherCreatorEntity,
  fir_creator: FirCreatorEntity,
};

export default entities;
