import { RaceSimulation } from './engine';
import { RaceEvent, RuntimeHorse } from '../types';
import { FRAME_TIME } from '../constants';

export class RaceCommentary {
  engine: RaceSimulation;

  constructor(engine: RaceSimulation) {
    this.engine = engine;
    this.init();
  }

  init() {
    this.engine.on(RaceEvent.START, this.onStart.bind(this));
    this.engine.on(RaceEvent.PHASE_CHANGE, this.onPhaseChange.bind(this));
    this.engine.on(RaceEvent.STAMINA_DEPLETED, this.onStaminaDepleted.bind(this));
    this.engine.on(RaceEvent.FINISH, this.onFinish.bind(this));
  }

  private onStart(horse: RuntimeHorse) {
    const delay = this.engine.time; 
    
    if (delay > 1.0) {
        this.engine.log(`这可真是世纪大出迟呢${horse.config.name}！`, 'critical');
    } else if (delay > 0.095) {
        this.engine.log(`哎呀！这是怎么了！${horse.config.name}处于很尴尬的位置从后方开始追赶。`, 'critical');
    } else if (delay > 0.09) {
        this.engine.log(`${horse.config.name}毫无疑问出迟了！！`, 'critical');
    } else if (delay > 0.085) {
        this.engine.log(`${horse.config.name}稍微有些出迟了！`, 'critical');
    } else if (delay > 0.08) {
        this.engine.log(`${horse.config.name}是出迟了吗！？`, 'critical');
    } else {
        if (delay <= 0.001) { 
             this.engine.log(`${horse.config.name} 漂亮的起跑！`);
        } else if (delay <= 0.08) {
             this.engine.log(`${horse.config.name} 起跑！`);
        }
    }
  }

  private onPhaseChange(data: { horse: RuntimeHorse, phase: number }) {
    const { horse, phase } = data;
    const sorted = [...this.engine.horses].sort((a,b) => b.distanceRun - a.distanceRun);
    if (sorted[0] !== horse) return; 

    if (this.engine.horses.length === 1) return; 

    switch (phase) {
        case 2:
            this.engine.log(`${horse.config.name}率先脱出，拿下领先位置！`, 'info');
            break;
        case 5:
            this.engine.log(`来到了中盘，目前领先的是${horse.config.name}！`, 'info');
            break;
        case 17:
            this.engine.log(`来到了终盘，目前领先的是${horse.config.name}！`, 'info');
            break;
        case 21:
            const secondHorse = sorted[1];
            if (!secondHorse) return;
            const diff = horse.distanceRun - secondHorse.distanceRun;
            
            if (diff > 25) {
                this.engine.log(`${horse.config.name}甩开后方很大的差距！在第二名的位置奔跑的是${secondHorse.config.name}。`, 'info');
            } else if (diff > 10) {
                this.engine.log(`${horse.config.name}遥遥领先！现在第二名是${secondHorse.config.name}。`, 'info');
            } else if (diff > 5) {
                this.engine.log(`${horse.config.name}保持领先！现在第二名是${secondHorse.config.name}。`, 'info');
            } else if (diff > 2.5) {
                this.engine.log(`脱颖而出的是${horse.config.name}！但${secondHorse.config.name}依然紧追不舍！`, 'info');
            } else {
                this.engine.log(`${horse.config.name}、${secondHorse.config.name}互不相让！`, 'info');
            }
            break;
    }
  }

  private onStaminaDepleted(horse: RuntimeHorse) {
     const sorted = [...this.engine.horses].sort((a,b) => b.distanceRun - a.distanceRun);
     const rank = sorted.indexOf(horse) + 1;

     if (rank === 1) {
         this.engine.log(`${horse.config.name}虽然辛苦但仍然坚持着！`, 'critical');
     } else if (rank === 2 || rank === 3) {
         this.engine.log(`${horse.config.name}到此为止了吗！`, 'critical');
     }
  }

  private onFinish(finishers: RuntimeHorse[]) {
     const finishedCountTotal = this.engine.finishedCount; 
     const alreadyFinishedCount = finishedCountTotal - finishers.length;
     
     if (alreadyFinishedCount === 0) {
         if (finishers.length > 1) {
             const names = finishers.map(h => h.config.name).join("、");
             this.engine.log(`${names}同时冲线！${finishers[0].config.name}是否在姿势上占有优势呢！`, 'finish');
         } else {
             const winner = finishers[0];
             const sorted = [...this.engine.horses].sort((a,b) => b.distanceRun - a.distanceRun);
             const second = sorted[1];
             
             if (second) {
                 const speed = second.currentSpeed.base; 
                 const timeDelta = this.engine.time - (winner.finishTime || this.engine.time);
                 const secondDistAtFinish = second.distanceRun - speed * timeDelta;
                 const diff = this.engine.race.distance - secondDistAtFinish;
                 
                 if (diff > 25) {
                     this.engine.log(`大差冲线！${winner.config.name}展现了压倒性的实力，制霸比赛！`, 'finish');
                 } else if (diff > 5) {
                     this.engine.log(`轻松胜利！${winner.config.name}！还有能和这位选手竞争的赛马娘吗！`, 'finish');
                 } else {
                     this.engine.log(`${winner.config.name}越过终点线！漂亮的胜利！`, 'finish');
                 }
             } else {
                 this.engine.log(`${winner.config.name}孤独的冲线！`, 'finish');
             }
         }
     } else if (alreadyFinishedCount === 1) {
         const firstOfBatch = finishers[0];
         if (finishers.length === 1) {
             this.engine.log(`第二名是${firstOfBatch.config.name}。`, 'finish');
         } else if (finishers.length === 2) {
             const secondOfBatch = finishers[1];
             if (secondOfBatch.config.name === "优秀素质") { 
                 this.engine.log(`${secondOfBatch.config.name}再次获得了第三名！第二名是${firstOfBatch.config.name}。`, 'finish');
             } else {
                 this.engine.log(`第二名是${firstOfBatch.config.name}；第三名是${secondOfBatch.config.name}。`, 'finish');
             }
         } else {
             this.engine.log(`第二名是${firstOfBatch.config.name}；第三名是${finishers[1].config.name}。`, 'finish');
         }
     } else if (alreadyFinishedCount === 2) {
         const third = finishers[0];
         if (third.config.name === "优秀素质") {
             this.engine.log(`${third.config.name}再夺铜牌！`, 'finish');
         } else {
             this.engine.log(`${third.config.name}第三个冲线。`, 'finish');
         }
     }
  }
}