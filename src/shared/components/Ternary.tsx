import React from 'react';

type TernaryProps = {
  condition: boolean;
  ifTrue: React.ReactNode;
  ifFalse: React.ReactNode;
};
export const Ternary: React.FC<TernaryProps> = ({ condition, ifTrue, ifFalse }) => {
  return condition ? ifTrue : ifFalse;
};
