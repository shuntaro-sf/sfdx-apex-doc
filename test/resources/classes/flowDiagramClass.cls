public inherited sharing class NoneMethods {
  public void method() {
    System.debug('dd');
    if (true) {
      System.debug('if'); 
    } else if (true) {
      System.debug('elseif');
    } else {
      System.debug('else');
    }
    System.debug('ddd');
    for (Integer idx = 0; idx < 10; idx++) {
      System.debug('for');
    }
    Integer i = 0;
    switch on i {
      when 1 {
        System.debug('1');
        if (i < 2) {
          System.debug('i is less than 2');
        } else {
          System.debug('i not is less than 2');
        }
      }
      when 2 {
        System.debug('2');
      }
    }
    while (i < 10) {
      System.debug(i);
      i++;
    }
  } 
}
