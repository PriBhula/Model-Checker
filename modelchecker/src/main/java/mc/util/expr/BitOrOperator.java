package mc.util.expr;

public class BitOrOperator extends Operator {

	public BitOrOperator(Expression lhs, Expression rhs){
		super(lhs, rhs);
	}

	public int evaluate(){
		int lhs = getLeftHandSide().evaluate();
		int rhs = getRightHandSide().evaluate();
		boolean result = lhs != 0 | rhs != 0;

		if(result){
			return 1;
		}

		return 0;
	}

}
