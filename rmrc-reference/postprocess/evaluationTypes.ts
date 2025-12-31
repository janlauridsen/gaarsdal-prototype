export interface TurnEvaluation {
  turnIndex: number;

  rolesInvoked: string[];
  rolesSkipped: {
    roleId: string;
    reason?: string;
  }[];

  boardsActive: string[];

  outputProduced: boolean;

  notes: string[];
}

export interface SessionEvaluation {
  turnCount: number;
  evaluations: TurnEvaluation[];

  observations: {
    silentTurns: number[];
    dominantRoles: string[];
    unusedRoles: string[];
  };
}
