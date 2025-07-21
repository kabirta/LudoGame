import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  player1Id: string;

  @Column({ type: 'uuid', nullable: true })
  player2Id: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'player1Id' })
  player1: Player;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'player2Id' })
  player2: Player;

  @Column({ default: 'waiting' })
  status: 'waiting' | 'in_progress' | 'completed';

  @CreateDateColumn()
  createdAt: Date;
}
